import streamlit as st
import os
from huggingface_hub import InferenceClient
from google import genai
from google.genai import types

# Weboldal alapbeállításai
st.set_page_config(page_title="FreeAI Chat Webapp", page_icon="🌐", layout="centered")

st.title("🌐 Univerzális Ingyenes AI Chat")
st.caption("Próbáld ki a legújabb open-source modelleket és a Gemini Flash-t teljesen ingyen!")

# API Kulcsok biztonságos beolvasása a környezeti változókból (A felhőben kell beállítani!)
# Lokális teszteléshez írd be ide ideiglenesen: HF_TOKEN = "a_te_kulcsod"
HF_TOKEN = os.environ.get("HF_TOKEN", "")
GEMINI_TOKEN = os.environ.get("GEMINI_TOKEN", "")

# Oldalsáv a modellválasztáshoz
st.sidebar.header("🤖 Modell Választás")
model_type = st.sidebar.selectbox(
    "Válassz motort:",
    ["Google Gemini (Ajánlott, stabil)", "Hugging Face Open-Source"]
)

if model_type == "Google Gemini (Ajánlott, stabil)":
    selected_model = "gemini-1.5-flash"
    st.sidebar.info("A Gemini 1.5 Flash rendkívül gyors és stabil válaszokat ad.")
else:
    hf_models = {
        "Meta Llama 3.1 (8B)": "meta-llama/Meta-Llama-3.1-8B-Instruct",
        "Mistral v0.3 (7B)": "mistralai/Mistral-7B-Instruct-v0.3",
        "Microsoft Phi-3 (Kicsi & Gyors)": "microsoft/Phi-3-mini-4k-instruct"
    }
    choice = st.sidebar.selectbox("Válassz nyílt modellt:", list(hf_models.keys()))
    selected_model = hf_models[choice]

# Chat előzmények inicializálása a memóriában (session state)
if "messages" not in st.session_state:
    st.session_state.messages = []

# Eddigi beszélgetés kirajzolása a képernyőre
for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])

# Felhasználói input kezelése
if prompt := st.chat_input("Írj egy üzenetet az AI-nak..."):
    # Felhasználó üzenetének mentése és kiírása
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)

    # AI válasz generálása
    with st.chat_message("assistant"):
        message_placeholder = st.empty()
        full_response = ""

        # --- 1. ÁG: GEMINI FLASH MEGHÍVÁSA ---
        if model_type == "Google Gemini (Ajánlott, stabil)":
            if not GEMINI_TOKEN:
                st.error("Rendszerhiba: A GEMINI_TOKEN nincs beállítva a szerveren!")
            else:
                try:
                    # Gemini kliens indítása a titkos kulccsal
                    client = genai.Client(api_key=GEMINI_TOKEN)
                    
                    # Előzmények átalakítása a Gemini formátumára
                    gemini_history = []
                    for m in st.session_state.messages[:-1]: # Az utolsót most küldjük
                        role = "user" if m["role"] == "user" else "model"
                        gemini_history.append(types.Content(role=role, parts=[types.Part.from_text(text=m["content"])]))
                    
                    # Chat indítása előzményekkel
                    chat = client.chats.create(model=selected_model, history=gemini_history)
                    
                    # Streamelt válasz lekérése
                    response_stream = chat.send_message(prompt, stream=True)
                    for chunk in response_stream:
                        if chunk.text:
                            full_response += chunk.text
                            message_placeholder.markdown(full_response + "▌")
                            
                    message_placeholder.markdown(full_response)
                    st.session_state.messages.append({"role": "assistant", "content": full_response})
                except Exception as e:
                    st.error(f"Szerver oldali hiba (Gemini): {e}")

        # --- 2. ÁG: HUGGING FACE MODELLEK MEGHÍVÁSA ---
        else:
            if not HF_TOKEN:
                st.error("Rendszerhiba: A HF_TOKEN nincs beállítva a szerveren!")
            else:
                try:
                    client = InferenceClient(model=selected_model, token=HF_TOKEN)
                    
                    for response in client.chat_completion(
                        messages=st.session_state.messages,
                        max_tokens=800,
                        stream=True,
                    ):
                        token = response.choices.delta.content
                        if token:
                            full_response += token
                            message_placeholder.markdown(full_response + "▌")
                            
                    message_placeholder.markdown(full_response)
                    st.session_state.messages.append({"role": "assistant", "content": full_response})
                except Exception as e:
                    st.error(f"A kiválasztott Hugging Face modell jelenleg túlterhelt vagy nem érhető el ingyenesen. Hiba: {e}")
