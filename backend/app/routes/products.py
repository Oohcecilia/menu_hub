from fastapi import APIRouter, Depends
from app.db import get_conn
import json


router = APIRouter()


def format_products(products):
    formatted = []

    for item in products:

        # HARD GUARD
        if not item.get("groupuids"):
            continue

        # parse properties safely
        try:
            props = json.loads(item["properties"]) if item.get("properties") else {}
        except:
            props = {}

        name = props.get("name", {})

        formatted.append({
            "id": item["uid"],
            "name": name.get("def", ""),
            "website_picture": item.get("website_picture", "")
        })

    return formatted


    

@router.get("/product-groups")
async def get_product_groups(buid: str, conn=Depends(get_conn)):

    products = []

    query = f"""
        SELECT pb.prices, pb.website_picture, p.*, pg.name as pgname, pg.properties as pgproperties
            FROM product_branches pb
            JOIN products p on p.uid = pb.puid
            JOIN product_groups pg on pg.uid = p.groupuid
        WHERE pb.website = 1
            AND p.active = 1
            AND pb.buid = %s
    """

    await conn.execute(query, (buid))
    results = await conn.fetchall()

    def safe_float(value):
        try:
            return float(value)
        except (TypeError, ValueError):
            return 0


    products = []
    categories = {}

    for row in results:
        # Parse once, safely
        try:
            prices = json.loads(row["prices"] or "{}")
        except Exception:
            continue

        php_price = prices.get("PHP")

        # Skip invalid prices early
        try:
            if float(php_price or 0) <= 0:
                continue
        except (TypeError, ValueError):
            continue

        groupuid = row["groupuid"]

        # Build category once
        if groupuid not in categories:
            categories[groupuid] = {
                "uid": groupuid,
                "name": row["pgname"],
                "properties": json.loads(row["pgproperties"] or "[]")
            }

        # Parse product properties safely once
        try:
            properties = json.loads(row["properties"] or "[]")
        except Exception:
            properties = []

        products.append({
            "uid": row["uid"],
            "name": row["name"],
            "properties": properties,
            "price": php_price,
            "groupuid": groupuid,
            "variations": row["variations"],
            "website_picture": row["website_picture"]
        })


    # --------------------------------------------------
    # 3. RETURN
    # --------------------------------------------------
    return {
        "categories": list(categories.values()),
        "products": products
    }