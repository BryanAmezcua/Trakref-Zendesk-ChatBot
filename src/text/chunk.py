from src.pipeline.models import Article
from langchain_text_splitters import RecursiveCharacterTextSplitter

def chunk_articles(articles: list[Article], chunk_size: int, chunk_overlap: int) -> list[Article]:
    """"Split each article.text into chunked Article records, copying metadata."""
    article_chunks: list[Article] = []

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        length_function=len,
        separators=["\n\n", "\n", " ", ""]
    )

    for article in articles:
        print(f"Processing: {article.article_name}")

        try:
            chunks = text_splitter.split_text(article.text or "")
            context_prefix = (
                f"Title: {article.title}\n"
                f"Category: {article.category_name}\n"
                f"Section: {article.section_name}\n\n"
            )

            for i, chunk_text in enumerate(chunks):
                chunk = Article(
                    id=f"{article.id}#chunk_{i}",
                    text=context_prefix + chunk_text,
                    article_name=article.article_name,
                    category_id=article.category_id,
                    category_name=article.category_name,
                    section_id=article.section_id,
                    section_name=article.section_name,
                    url=article.url,
                    title=article.title,
                    updated_at=article.updated_at,
                )
                article_chunks.append(chunk)

        except Exception as e:
            print(f"  -> Error processing {article.article_name}: {e}")

    print(f"\nTotal chunks created: {len(article_chunks)}")
    return article_chunks
