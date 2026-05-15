from fastapi import APIRouter, Depends
from app.db import get_conn
import json
import logging
from collections import defaultdict
from fastapi import APIRouter, Depends, Request


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


router = APIRouter()


@router.get("/product-groups")
async def get_product_groups(
    request: Request,
    conn=Depends(get_conn)
):

    host = request.url.hostname 
    # host = "iloilo.giuseppe.ph"

    await conn.execute(query, (host,))
    results = await conn.fetchall()

    products = []
    categories = {}
    subCategories = {}

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

        groupuid = row["mcuid"]
        product_group_uid = row["subpgu"]

        try:
            properties = json.loads(row["pgproperties"] or "{}")
        except Exception:
            properties = {}

        # Build category once
        if groupuid not in categories:
            categories[groupuid] = {
                "uid": groupuid,
                "name": row["mctitle"],
                "order": row["mcorder"]
                "properties":
            }


        if product_group_uid not in subCategories:

            subCategories[product_group_uid] = {
                "uid": product_group_uid,
                "cuid": groupuid,
                "properties": properties
            }


        # Parse product properties safely once
        try:
            properties = json.loads(row["properties"] or "[]")
        except Exception:
            properties = []

        products.append({
            "uid": row["uid"],
            "name": row["name"],
            "image": f"https://pp.d3.net/image.php?a=product-{row['uid']}",
            "properties": properties,
            "price": php_price,
            "groupuid": groupuid,
            "productgroup": product_group_uid,
            "variations": row["variations"],
            "website_picture": row["website_picture"]
        })



    # logging.info(f"subCategories {subCategories}")
    # --------------------------------------------------
    # 3. RETURN
    # --------------------------------------------------
    return {
        "categories": list(categories.values()),
        "subCategories": list(subCategories.values()),
        "products": products
    }























































    # query = """
    #     SELECT
    #         pb.prices, 
    #         pb.website_picture,
    #         p.*,
    #         mc.uid AS mcuid,
    #         mc.title AS mctitle,
    #         mc.sorder AS mcorder,
    #         mcpg.product_group_uid AS subpgu,
    #         pg.name AS pgname,
    #         pg.properties AS pgproperties
    #     FROM menus m
    #     JOIN menu_categories mc
    #         ON mc.menu_uid = m.uid
    #     JOIN menu_category_product_groups mcpg
    #         ON mcpg.menu_category_uid = mc.uid
    #     JOIN product_groups pg
    #         ON pg.uid = mcpg.product_group_uid
    #     JOIN product_group_products pgp
    #         ON pgp.groupuid = pg.uid
    #     JOIN products p
    #         ON p.uid = pgp.puid
    #     JOIN product_branches pb
    #         ON pb.puid = p.uid AND pb.buid = m.buid
    #     WHERE pb.website = 1
    #         AND m.active = 1
    #         AND m.menu_url = %s
    #     ORDER BY mc.sorder ASC
    # """



    # for row in results:
    #     # Parse prices safely
    #     try:
    #         prices = json.loads(row["prices"] or "{}")
    #     except Exception:
    #         continue

    #     php_price = prices.get("PHP")

    #     # Skip invalid prices
    #     try:
    #         if float(php_price or 0) <= 0:
    #             continue
    #     except (TypeError, ValueError):
    #         continue

    #     groupuid = row["groupuid"]

    #     # Build category once
    #     if groupuid not in categories:
    #         categories[groupuid] = {
    #             "uid": groupuid,
    #             "name": row["pgname"],
    #             "properties": json.loads(row["pgproperties"] or "[]")
    #         }

    #     # Parse product properties safely
    #     try:
    #         properties = json.loads(row["properties"] or "[]")
    #     except Exception:
    #         properties = []

    #     # Extract product name
    #     product_name = None
    #     for prop in properties:
    #         if isinstance(prop, dict):
    #             name_obj = prop.get("name", {})
    #             if isinstance(name_obj, dict):
    #                 product_name = name_obj.get("def")
    #                 if product_name:
    #                     break

    #     if not product_name:
    #         product_name = row["name"]

    #     # INIT GROUP
    #     if product_name not in grouped_products:
    #         grouped_products[product_name] = {
    #             "name": product_name,
    #             "description": row.get("description", ""),
    #             "image_uid": None,
    #             "prices": []
    #         }

    #     group = grouped_products[product_name]

    #     # ✅ FORCE INT CHECK (IMPORTANT)
    #     website_flag = int(row.get("website_picture") or 0)

    #     # take first valid image only
    #     if website_flag == 1 and not group["image_uid"]:
    #         group["image_uid"] = row["uid"]

    #     # fallback if none selected yet
    #     if not group["image_uid"]:
    #         group["image_uid"] = row["uid"]

    #     group["image"] = f"https://pp.d3.net/image.php?a=product-{group['image_uid']}"

    #     # Append price entry
    #     group["prices"].append({
    #         "uid": row["uid"],
    #         "price": php_price,
    #         "label": f'{row.get("baseconversion", "")}{row.get("uunit", "")}',
    #         "properties": properties,
    #         "variations": row.get("variations")
    #     })

    # # Final list
    # pproducts = list(grouped_products.values())

    # for i, row in enumerate(pproducts[:5]):
    #     logger.info(f"[{i}] ROW: {row}")
