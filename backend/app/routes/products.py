from fastapi import APIRouter, Depends
from app.db import get_conn

router = APIRouter()



@router.get("/product-groups")
async def get_product_groups(buid: str, conn=Depends(get_conn)):

    # --------------------------------------------------
    # 1. GET CATEGORIES
    # --------------------------------------------------
    category_query = """
    SELECT 
        pg.*, 
        JSON_UNQUOTE(JSON_EXTRACT(pg.properties, '$.name.def')) as orderfield
    FROM product_groups AS pg
    WHERE pg.website = 1
    AND (
        SELECT COUNT(*)
        FROM products
        LEFT JOIN product_branches 
            ON product_branches.puid = products.uid
        WHERE 
            JSON_EXTRACT(product_branches.prices, '$.PHP') > 0
            AND product_branches.website = 1
            AND products.active = 1
            AND products.groupuid = pg.uid
            AND product_branches.buid = %s
            AND JSON_CONTAINS(products.groupuids, pg.uid)
        GROUP BY products.groupuid
    ) > 0
    """

    await conn.execute(category_query, (buid,))
    categories = await conn.fetchall()

    category_uids = [c["uid"] for c in categories]

    # --------------------------------------------------
    # 2. GET PRODUCTS
    # --------------------------------------------------
    products = []

    if category_uids:
        placeholders = ",".join(["%s"] * len(category_uids))

        product_query = f"""
        SELECT 
            p.uid,
            p.properties,
            p.groupuids,
            pg.properties as pgproperties,
            GROUP_CONCAT(
                CONCAT(pb.prices, '|', pb.remark)
            ) as pricing,
            p.variations,
            pb.website_picture
        FROM products AS p
        LEFT JOIN product_groups AS pg 
            ON JSON_CONTAINS(p.groupuids, JSON_QUOTE(pg.uid))
        LEFT JOIN product_branches AS pb 
            ON pb.puid = p.uid
        WHERE 
            JSON_EXTRACT(pb.prices, '$.PHP') > 0
            AND pb.website = 1
            AND p.active = 1
            AND pb.buid = %s
            AND p.groupuid IN ({placeholders})
            AND p.name != ''
        GROUP BY p.uid
        ORDER BY JSON_EXTRACT(p.properties, '$.Category') ASC
        """

        await conn.execute(product_query, (buid, *category_uids))
        products = await conn.fetchall()

    # --------------------------------------------------
    # 3. RETURN
    # --------------------------------------------------
    return {
        "categories": categories,
        "products": products
    }