def clean_rag_facts(text: str) -> str:
    """Clean and format RAG facts for better presentation"""
    if not text:
        return ""
    
    # Split into lines and remove empty ones
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    
    # Remove duplicate lines while preserving order
    seen = set()
    unique_lines = []
    for line in lines:
        if line not in seen:
            seen.add(line)
            unique_lines.append(line)
    
    # Join lines with double newlines for better readability
    return "\n\n".join(unique_lines)