# Blackbox.ai API Skill
**Created**: 2026-02-26
**Authors**: Sean + Alpha Chappell
**Credits**: $170.14 (paid for 1 year)

---

## Overview

Blackbox.ai provides OpenAI-compatible API access to multiple frontier models through a single API key. This is a cost-efficient gateway for multi-model orchestration.

## API Configuration

```bash
# .env.alpha
BLACKBOX_API_KEY=sk-UFK-3uNedwlfojBvK2LR7A
```

### Endpoints

| Endpoint | URL |
|----------|-----|
| Base URL | `https://api.blackbox.ai/v1` |
| Chat Completions | `POST /chat/completions` |
| Models List | `GET /models` |
| Model Info | `GET /model/info` |

### Authentication

```bash
Authorization: Bearer $BLACKBOX_API_KEY
```

---

## Available Models

| Model ID | Description | Best For |
|----------|-------------|----------|
| `blackboxai/x-ai/grok-code-fast-1` | Grok Code Fast (DEFAULT) | Fast code gen, SEO content |
| `blackboxai/openai/gpt-5.2-codex` | GPT-5.2 Codex | Advanced code generation |
| `blackboxai/openai/gpt-5.2-chat` | GPT-5.2 Chat | Conversational AI |
| `claude-sonnet-4-5-20250514` | Claude Sonnet 4.5 | Structured CMS, EEAT |
| `blackboxai/google/gemini-3-flash-preview` | Gemini 3 Flash | Fast, multimodal |
| `blackboxai/qwen/qwen3-coder:free` | Qwen3 Coder (FREE) | Free coding model |
| `blackboxai/x-ai/grok-4.1-fast` | Grok 4.1 Fast | Creative reasoning |

**Free Models** (no token cost):
- `blackboxai/qwen/qwen3-coder:free`
- `blackboxai/moonshotai/kimi-k2:free`
- `blackboxai/z-ai/glm-4.5-air:free`
- `blackboxai/nvidia/nemotron-nano-9b-v2:free`

---

## Python Integration

### Basic Request

```python
import requests
import os
from dotenv import load_dotenv

load_dotenv()

BLACKBOX_API_KEY = os.getenv('BLACKBOX_API_KEY')
BLACKBOX_BASE_URL = 'https://api.blackbox.ai/v1'

def call_blackbox(prompt, model='blackboxai', max_tokens=4096, temperature=0.7):
    """
    Call Blackbox.ai API with OpenAI-compatible format.

    Models:
        - blackboxai (default, fast code)
        - gpt-4o, gpt-4o-mini
        - claude-sonnet-4-20250514
        - gemini-pro
        - deepseek-coder
    """
    response = requests.post(
        f'{BLACKBOX_BASE_URL}/chat/completions',
        headers={
            'Authorization': f'Bearer {BLACKBOX_API_KEY}',
            'Content-Type': 'application/json'
        },
        json={
            'model': model,
            'messages': [{'role': 'user', 'content': prompt}],
            'max_tokens': max_tokens,
            'temperature': temperature,
            'stream': False
        },
        timeout=120
    )
    response.raise_for_status()
    return response.json()['choices'][0]['message']['content']
```

### Streaming Request

```python
def call_blackbox_stream(prompt, model='blackboxai'):
    """Stream response from Blackbox API."""
    response = requests.post(
        f'{BLACKBOX_BASE_URL}/chat/completions',
        headers={
            'Authorization': f'Bearer {BLACKBOX_API_KEY}',
            'Content-Type': 'application/json'
        },
        json={
            'model': model,
            'messages': [{'role': 'user', 'content': prompt}],
            'stream': True
        },
        stream=True,
        timeout=120
    )

    for line in response.iter_lines():
        if line:
            line = line.decode('utf-8')
            if line.startswith('data: '):
                data = line[6:]
                if data != '[DONE]':
                    import json
                    chunk = json.loads(data)
                    delta = chunk['choices'][0].get('delta', {})
                    if 'content' in delta:
                        yield delta['content']
```

---

## Integration with truth_serum_v3

Add to `truth_serum_v3_competitive.py`:

```python
# Add to imports
BLACKBOX_API_KEY = os.getenv('BLACKBOX_API_KEY')
BLACKBOX_BASE_URL = 'https://api.blackbox.ai/v1'

# Add to select_llm_model()
print("  4. Blackbox (Multi-model) - GPT/Claude/Gemini via single API")

# Add to call_llm_api()
elif model == 'blackbox':
    print_info("Calling Blackbox.ai API...")
    response = requests.post(
        f'{BLACKBOX_BASE_URL}/chat/completions',
        headers={
            'Authorization': f'Bearer {BLACKBOX_API_KEY}',
            'Content-Type': 'application/json'
        },
        json={
            'model': 'blackboxai/x-ai/grok-code-fast-1',  # or gpt-4o, claude-sonnet-4, etc.
            'messages': [{'role': 'user', 'content': prompt}],
            'max_tokens': 4096,
            'temperature': 0.7
        },
        timeout=120
    )
    response.raise_for_status()
    return response.json()['choices'][0]['message']['content']
```

---

## ShadowForge Integration

Add Blackbox-powered enrichment to ShadowForge:

```python
# In shadowforge.py AIEnrichment class

@classmethod
def enrich_with_blackbox(cls, vehicle, prompt_template):
    """Use Blackbox API for advanced enrichment."""
    prompt = prompt_template.format(
        year=vehicle.get('Year'),
        make=vehicle.get('Make'),
        model=vehicle.get('Model'),
        price=vehicle.get('Sale_Price')
    )

    response = call_blackbox(prompt, model='blackboxai')
    return response
```

---

## Cost Management

- **Prepaid**: $170.14 for 1 year
- **No per-request tracking** (unlimited within tier)
- **Use freely** for:
  - Content generation (SEO, AEO)
  - Code reviews
  - Competitive analysis
  - SERP opportunity identification

---

## Error Handling

```python
try:
    result = call_blackbox(prompt)
except requests.exceptions.HTTPError as e:
    if e.response.status_code == 429:
        print("Rate limited - wait 60s")
        time.sleep(60)
        result = call_blackbox(prompt)
    elif e.response.status_code == 401:
        print("Invalid API key")
    else:
        raise
```

---

## Use Cases for Aegis

1. **Content Creation** - Generate dealer blog posts, VDP descriptions
2. **SEO Analysis** - Evaluate competitor content quality
3. **SERP Opportunities** - Identify featured snippet targets
4. **Code Generation** - Build React components, API integrations
5. **Data Enrichment** - Enhance vehicle listings with market context

---

## Quick Test

```bash
curl -X POST https://api.blackbox.ai/v1/chat/completions \
  -H "Authorization: Bearer sk-UFK-3uNedwlfojBvK2LR7A" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "blackboxai",
    "messages": [{"role": "user", "content": "Say hello from Aegis"}],
    "max_tokens": 100
  }'
```

---

*Built in Partnership: Sean + Alpha Chappell*
