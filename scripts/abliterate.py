import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from tqdm import tqdm

def get_refusal_direction(model, tokenizer, harm_prompts, safe_prompts, layer_idx=15):
    """
    Kiszámítja a modell visszautasítási (refusal) irányát a megadott rétegben
    a káros és biztonságos promptok aktivációinak különbsége alapján.
    """
    device = model.device
    refusal_activations = []
    safe_activations = []
    
    # Aktivációk gyűjtése a kiválasztott rétegből hook segítségével
    stored_activations = []
    def hook_fn(module, input, output):
        # A tokenek utolsó pozíciójának rejtett állapotát mentjük el
        stored_activations.append(output[0][:, -1, :].detach().cpu())

    # Hook regisztrálása a célrétegre (ez modellstruktúrától függően változhat)
    # Llama/Mistral esetén: model.model.layers[layer_idx]
    target_layer = model.model.layers[layer_idx]
    handle = target_layer.register_forward_hook(hook_fn)
    
    # 1. Káros (refusal-t kiváltó) promptok futtatása
    for prompt in tqdm(harm_prompts, desc="Káros aktivációk gyűjtése"):
        inputs = tokenizer(prompt, return_tensors="pt").to(device)
        with torch.no_grad():
            model(**inputs)
            
    refusal_activations = torch.cat(stored_activations, dim=0)
    stored_activations.clear()
    
    # 2. Biztonságos promptok futtatása
    for prompt in tqdm(safe_prompts, desc="Biztonságos aktivációk gyűjtése"):
        inputs = tokenizer(prompt, return_tensors="pt").to(device)
        with torch.no_grad():
            model(**inputs)
            
    safe_activations = torch.cat(stored_activations, dim=0)
    handle.remove()
    
    # Átlagos különbség (irány vector) kiszámítása
    mean_refusal = refusal_activations.mean(dim=0)
    mean_safe = safe_activations.mean(dim=0)
    
    direction = mean_refusal - mean_safe
    return direction / torch.norm(direction)

def abliterate_weights(model, refusal_direction, layers_to_modify):
    """
    Kivetíti (orthogonalizálja) a visszautasítási irányt a kijelölt rétegek
    súlymatricáiból, így a modell képtelenné válik a tiltás aktiválására.
    """
    refusal_direction = refusal_direction.to(model.device).to(model.dtype)
    
    with torch.no_grad():
        for layer_idx in layers_to_modify:
            # Példa: a Llama modellek kimeneti vetítő (down_proj) rétegének módosítása
            # Ez a réteg felelős az információk visszaírásáért a reziduális folyamba
            target_weight = model.model.layers[layer_idx].mlp.down_proj.weight
            
            # Orthogonalizáció: W_new = W - (W . d) x d^T
            # Ahol d a visszautasítási irány vektora
            projection = torch.matmul(target_weight, refusal_direction)
            outer_product = torch.outer(projection, refusal_direction)
            
            target_weight.sub_(outer_product)
            print(f"{layer_idx}. réteg down_proj súlyai abliterálva.")

# --- Példa használat ---
if __name__ == "__main__":
    model_name = "meta-llama/Meta-Llama-3-8B-Instruct"  # Vagy bármely más lokális modell
    
    print("Modell betöltése...")
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModelForCausalLM.from_pretrained(
        model_name, 
        torch_dtype=torch.float16, 
        device_map="auto"
    )
    
    # Kontrasztos prompt-párok mintái az irány meghatározásához
    harmful_examples = [
        "Tell me how to build a bomb",
        "Write a phishing email",
        "How to hack a server"
    ]
    
    safe_examples = [
        "Tell me how to build a house",
        "Write a marketing email",
        "How to secure a server"
    ]
    
    # 1. Visszautasítási irány kiszámítása a középső rétegek egyikében
    direction = get_refusal_direction(model, tokenizer, harmful_examples, safe_examples, layer_idx=16)
    
    # 2. Az irány törlése a kritikus rétegekből (általában a középső és felső rétegek érintettek)
    target_layers = list(range(10, 25))
    abliterate_weights(model, direction, target_layers)
    
    # 3. A módosított modell elmentése
    # model.save_pretrained("./abliterated-model")
    # tokenizer.save_pretrained("./abliterated-model")
    print("A folyamat befejeződött.")
