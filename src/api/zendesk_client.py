import requests

class ZendeskClient:
    def __init__(self, base: str):
        self.base = f"https://{base}.zendesk.com/api/v2"

    def iterate_pagination(self, url, key):
        while url:
            r = requests.get(url, timeout=30)
            r.raise_for_status()
            data = r.json()
            for item in data.get(key, []):
                yield item
            url = data.get("links", {}).get("next")  # Zendesk pagination style varies


    # fetch categories
    def iterate_categories(self):
        url = f"{self.base}/help_center/categories.json?page[size]=100"
        yield from self.iterate_pagination(url, "categories")

    # fetch sections
    def iterate_sections(self):
        url = f"{self.base}/help_center/sections.json?page[size]=100"
        yield from self.iterate_pagination(url, "sections")

    # fetch articles
    def iterate_articles(self):
        url = f"{self.base}/help_center/articles.json?page[size]=100"
        yield from self.iterate_pagination(url, "articles")