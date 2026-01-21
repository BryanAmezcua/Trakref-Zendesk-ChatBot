from bs4 import BeautifulSoup

def html_to_text(html: str) -> str:
    if not html: # None or ""
        return ""
    
    soup = BeautifulSoup(html, "html.parser")

    # Remove scripts/styles
    for tag in soup(["script", "style"]):
        tag.decompose()

    # Replace images with readable placeholders
    for img in soup.find_all("img"):
        alt = img.get("alt") or "image"
        src = img.get("src") or ""
        img.replace_with(f"[Image: {alt}] {src}")

    # Extract text with structure preserved
    text = soup.get_text(separator="\n")

    # Normalize whitespace
    lines = [line.strip() for line in text.splitlines()]
    return "\n".join(line for line in lines if line)