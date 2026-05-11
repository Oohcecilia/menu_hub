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



    products = []
    categories = {}
    for row in results:
        prices = json.loads(row["prices"])
        if not "PHP" in prices: continue
        if float(prices["PHP"]) > 0:
            if not row["groupuid"] in categories:
                categories[row["groupuid"]] = {
                    "uid": row["groupuid"],
                    "name": row["pgname"],
                    "properties": json.loads(row["pgproperties"]) if row["pgproperties"] else []
                }
            products.append({
                "uid": row["uid"],
                "properties": json.loads(row["properties"]) if row["properties"] else [],
                "price": prices["PHP"],
                "groupuid": row["groupuid"]
            })


    # --------------------------------------------------
    # 3. RETURN
    # --------------------------------------------------
    return {
        "categories": list(categories.values()),
        "products": products
    }