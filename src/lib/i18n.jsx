import React, { createContext, useContext, useState, useEffect } from 'react';


const translations = {
  en: {
    menu: "Menu", categories: "Categories", all: "All", popular: "Popular",
    addToCart: "Add to Selection", added: "Added!", cart: "Cart", yourCart: "My Selections",
    emptyCart: "Your cart is empty", emptyCartDesc: "Browse our menu and add delicious items",
    browseMenu: "Browse Menu", quantity: "Quantity", specialInstructions: "Any special instructions?",
    note: "Item Note", orderNote: "Order Note", orderNotePlaceholder: "Any notes for the entire order (allergies, preferences...)",
    subtotal: "Subtotal", total: "Total", checkout: "Checkout",
    placeOrder: "Place Order", placing: "Placing...", orderPlaced: "Order Placed!",
    orderSuccess: "Your order has been placed successfully", orderNumber: "Order Number",
    orderSummary: "Order Summary", scanQR: "Show this QR code to your waiter to continue.",
    backToMenu: "Back to Menu", trackOrder: "Track Order", guestCheckout: "Guest Checkout",
    nameOptional: "Your name", tableOptional: "Table number",
    namePlaceholder: "e.g. John", tablePlaceholder: "e.g. 12",
    items: "items", item: "item", remove: "Remove", close: "Close",
    orderDetails: "Order Details", status: "Status",
    pending: "Pending", preparing: "Preparing", ready: "Ready for Pickup",
    completed: "Completed", cancelled: "Cancelled",
    placedAt: "Placed at", customer: "Customer", table: "Table",
    language: "Language", darkMode: "Dark Mode", lightMode: "Light Mode",
    searchMenu: "Search dishes...", noResults: "No items found", viewOrder: "View Selection",
    optional: "optional", continueToPayment: "Review & Place Order",
    guestInfo: "Guest Info", yourOrder: "Your Order", orderHistory: "Order History", 
    recentOrder: "Your recent orders", 
    more: "more", 
    featured: "featured",
    no_past_orders: "No past orders",
    orders_placeholder: "Orders you place will appear here",
    historyPlaced: "Order placed",
    viewReceipt: "View Receipt",
    option: "Option",
    pleaseReviewYourSelection: "Please review your selection",
  },
  es: {
    menu: "Menú", categories: "Categorías", all: "Todo", popular: "Popular",
    addToCart: "Añadir a la selección", added: "¡Agregado!", cart: "Carrito", yourCart: "Mis selecciones",
    emptyCart: "Tu carrito está vacío", emptyCartDesc: "Explora nuestro menú y agrega platillos",
    browseMenu: "Ver Menú", quantity: "Cantidad", specialInstructions: "¿Instrucciones especiales?",
    note: "Nota del artículo", orderNote: "Nota del pedido", orderNotePlaceholder: "Notas para todo el pedido (alergias, preferencias...)",
    subtotal: "Subtotal", total: "Total", checkout: "Pagar",
    placeOrder: "Realizar Pedido", placing: "Procesando...", orderPlaced: "¡Pedido Realizado!",
    orderSuccess: "Tu pedido ha sido realizado exitosamente", orderNumber: "Número de Pedido",
    orderSummary: "Resumen del Pedido", scanQR: "Muestra este código QR a tu camarero para continuar.",
    backToMenu: "Volver al Menú", trackOrder: "Rastrear Pedido", guestCheckout: "Pago como Invitado",
    nameOptional: "Tu nombre", tableOptional: "Número de mesa",
    namePlaceholder: "ej. Juan", tablePlaceholder: "ej. 12",
    items: "artículos", item: "artículo", remove: "Eliminar", close: "Cerrar",
    orderDetails: "Detalles del Pedido", status: "Estado",
    pending: "Pendiente", preparing: "Preparando", ready: "Listo para recoger",
    completed: "Completado", cancelled: "Cancelado",
    placedAt: "Realizado el", customer: "Cliente", table: "Mesa",
    language: "Idioma", darkMode: "Modo Oscuro", lightMode: "Modo Claro",
    searchMenu: "Buscar platillos...", noResults: "No se encontraron artículos", viewOrder: "Ver selección",
    optional: "opcional", continueToPayment: "Revisar y pedir",
    guestInfo: "Info del invitado", yourOrder: "Tu Pedido", orderHistory: "Historial de pedidos", recentOrder: 'Tus pedidos recientes',
    more: "más",
    featured: "destacado",
    no_past_orders: "No hay pedidos anteriores",
    orders_placeholder: "Los pedidos que realices aparecerán aquí",
    historyPlaced: "Pedido realizado",
    viewReceipt: "Ver recibo",
    option: "Opción",
    pleaseReviewYourSelection: "Por favor revisa tu selección",
  },
  de: {
    menu: "Speisekarte", categories: "Kategorien", all: "Alle", popular: "Beliebt",
    addToCart: "Zur Auswahl hinzufügen", added: "Hinzugefügt!", cart: "Warenkorb", yourCart: "Meine Auswahl",
    emptyCart: "Ihr Warenkorb ist leer", emptyCartDesc: "Stöbern Sie in unserer Speisekarte",
    browseMenu: "Speisekarte", quantity: "Menge", specialInstructions: "Besondere Wünsche?",
    note: "Artikelnotiz", orderNote: "Bestellnotiz", orderNotePlaceholder: "Hinweise zur gesamten Bestellung (Allergien, Präferenzen...)",
    subtotal: "Zwischensumme", total: "Gesamt", checkout: "Zur Kasse",
    placeOrder: "Bestellen", placing: "Wird bearbeitet...", orderPlaced: "Bestellung aufgegeben!",
    orderSuccess: "Ihre Bestellung wurde erfolgreich aufgegeben", orderNumber: "Bestellnummer",
    orderSummary: "Bestellübersicht", scanQR: "Zeigen Sie Ihrem Kellner diesen QR-Code, um fortzufahren.",
    backToMenu: "Zurück zur Speisekarte", trackOrder: "Bestellung verfolgen", guestCheckout: "Gast-Checkout",
    nameOptional: "Ihr Name", tableOptional: "Tischnummer",
    namePlaceholder: "z.B. Max", tablePlaceholder: "z.B. 12",
    items: "Artikel", item: "Artikel", remove: "Entfernen", close: "Schließen",
    orderDetails: "Bestelldetails", status: "Status",
    pending: "Ausstehend", preparing: "Wird zubereitet", ready: "Abholbereit",
    completed: "Abgeschlossen", cancelled: "Storniert",
    placedAt: "Bestellt um", customer: "Kunde", table: "Tisch",
    language: "Sprache", darkMode: "Dunkelmodus", lightMode: "Hellmodus",
    searchMenu: "Gerichte suchen...", noResults: "Keine Artikel gefunden", viewOrder: "Auswahl anzeigen",
    optional: "optional", continueToPayment: "Überprüfen & bestellen",
    guestInfo: "Gastinfo", yourOrder: "Ihre Bestellung", orderHistory: "Bestellhistorie", recentOrder: 'Ihre letzten Bestellungen',  more: "mehr",
    featured: "empfohlen",
    no_past_orders: "Keine vergangenen Bestellungen",
    orders_placeholder: "Deine Bestellungen werden hier angezeigt",
    historyPlaced: "Bestellung aufgegeben",
    viewReceipt: "Beleg anzeigen",
    option: "Option",
    pleaseReviewYourSelection: "Bitte überprüfen Sie Ihre Auswahl",
  },
  fr: {
    menu: "Menu", categories: "Catégories", all: "Tout", popular: "Populaire",
    addToCart: "Ajouter à la sélection", added: "Ajouté!", cart: "Panier", yourCart: "Mes sélections",
    emptyCart: "Votre panier est vide", emptyCartDesc: "Parcourez notre menu et ajoutez des plats",
    browseMenu: "Voir le menu", quantity: "Quantité", specialInstructions: "Instructions spéciales?",
    note: "Note article", orderNote: "Note de commande", orderNotePlaceholder: "Notes pour toute la commande (allergies, préférences...)",
    subtotal: "Sous-total", total: "Total", checkout: "Commander",
    placeOrder: "Passer la commande", placing: "En cours...", orderPlaced: "Commande passée!",
    orderSuccess: "Votre commande a été passée avec succès", orderNumber: "Numéro de commande",
    orderSummary: "Récapitulatif", scanQR: "Montrez ce code QR à votre serveur pour continuer",
    backToMenu: "Retour au menu", trackOrder: "Suivre la commande", guestCheckout: "Commande invité",
    nameOptional: "Votre nom", tableOptional: "Numéro de table",
    namePlaceholder: "ex. Jean", tablePlaceholder: "ex. 12",
    items: "articles", item: "article", remove: "Supprimer", close: "Fermer",
    orderDetails: "Détails commande", status: "Statut",
    pending: "En attente", preparing: "En préparation", ready: "Prêt à récupérer",
    completed: "Terminé", cancelled: "Annulé",
    placedAt: "Commandé le", customer: "Client", table: "Table",
    language: "Langue", darkMode: "Mode sombre", lightMode: "Mode clair",
    searchMenu: "Rechercher des plats...", noResults: "Aucun article trouvé", viewOrder: "Voir la sélection",
    optional: "optionnel", continueToPayment: "Vérifier & commander",
    guestInfo: "Info invité", yourOrder: "Votre Commande", orderHistory: "Historique des commandes", recentOrder: 'Vos commandes récentes',     more: "plus",
    featured: "en vedette",
    no_past_orders: "Aucune commande précédente",
    orders_placeholder: "Les commandes que vous passez apparaîtront ici",
    historyPlaced: "Commande passée",
    viewReceipt: "Voir le reçu",
    option: "Option",
    pleaseReviewYourSelection: "Veuillez vérifier votre sélection",
  },
  it: {
    menu: "Menu", categories: "Categorie", all: "Tutto", popular: "Popolare",
    addToCart: "Aggiungi alla selezione", added: "Aggiunto!", cart: "Carrello", yourCart: "Le mie selezioni",
    emptyCart: "Il carrello è vuoto", emptyCartDesc: "Sfoglia il menu e aggiungi piatti",
    browseMenu: "Sfoglia menu", quantity: "Quantità", specialInstructions: "Istruzioni speciali?",
    note: "Nota articolo", orderNote: "Nota ordine", orderNotePlaceholder: "Note per tutto l'ordine (allergie, preferenze...)",
    subtotal: "Subtotale", total: "Totale", checkout: "Checkout",
    placeOrder: "Ordina", placing: "Elaborando...", orderPlaced: "Ordine inviato!",
    orderSuccess: "Il tuo ordine è stato inviato con successo", orderNumber: "Numero ordine",
    orderSummary: "Riepilogo ordine", scanQR: "Mostra questo codice QR al tuo cameriere per continuare",
    backToMenu: "Torna al menu", trackOrder: "Traccia ordine", guestCheckout: "Checkout ospite",
    nameOptional: "Il tuo nome", tableOptional: "Numero tavolo",
    namePlaceholder: "es. Marco", tablePlaceholder: "es. 12",
    items: "articoli", item: "articolo", remove: "Rimuovi", close: "Chiudi",
    orderDetails: "Dettagli ordine", status: "Stato",
    pending: "In attesa", preparing: "In preparazione", ready: "Pronto",
    completed: "Completato", cancelled: "Annullato",
    placedAt: "Ordinato il", customer: "Cliente", table: "Tavolo",
    language: "Lingua", darkMode: "Modalità scura", lightMode: "Modalità chiara",
    searchMenu: "Cerca piatti...", noResults: "Nessun articolo trovato", viewOrder: "Visualizza selezione",
    optional: "opzionale", continueToPayment: "Rivedi & ordina",
    guestInfo: "Info ospite", yourOrder: "Il tuo Ordine", orderHistory: "Cronologia degli ordini", recentOrder: "I tuoi ordini recenti", more: "altro",
    featured: "in evidenza",
    no_past_orders: "Nessun ordine precedente",
    orders_placeholder: "Gli ordini effettuati appariranno qui",
    historyPlaced: "Ordine effettuato",
    viewReceipt: "Visualizza ricevuta",
    option: "Opzione",
    pleaseReviewYourSelection: "Si prega di rivedere la tua selezione",
  },
  zh: {
    menu: "菜单", categories: "分类", all: "全部", popular: "热门",
    addToCart: "添加到选择", added: "已添加!", cart: "购物车", yourCart: "我的选择",
    emptyCart: "购物车为空", emptyCartDesc: "浏览菜单并添加美食",
    browseMenu: "浏览菜单", quantity: "数量", specialInstructions: "特殊要求?",
    note: "备注", orderNote: "订单备注", orderNotePlaceholder: "整单备注（过敏、偏好等）",
    subtotal: "小计", total: "合计", checkout: "结账",
    placeOrder: "下单", placing: "处理中...", orderPlaced: "订单已下！",
    orderSuccess: "您的订单已成功提交", orderNumber: "订单号",
    orderSummary: "订单摘要", scanQR: "向服務生出示此二維碼即可繼續",
    backToMenu: "返回菜单", trackOrder: "追踪订单", guestCheckout: "访客结账",
    nameOptional: "您的姓名", tableOptional: "桌号",
    namePlaceholder: "例: 张三", tablePlaceholder: "例: 12",
    items: "件", item: "件", remove: "删除", close: "关闭",
    orderDetails: "订单详情", status: "状态",
    pending: "待处理", preparing: "准备中", ready: "可取餐",
    completed: "已完成", cancelled: "已取消",
    placedAt: "下单时间", customer: "客户", table: "桌号",
    language: "语言", darkMode: "深色模式", lightMode: "浅色模式",
    searchMenu: "搜索菜品...", noResults: "未找到菜品", viewOrder: "查看选择",
    optional: "选填", continueToPayment: "确认并下单",
    guestInfo: "访客信息", yourOrder: "我的订单", orderHistory: "订单记录", recentOrder: "您最近的订单",    more: "更多",
    featured: "精选",
    no_past_orders: "没有历史订单",
    orders_placeholder: "您下的订单将显示在这里",
    historyPlaced: "订单已提交",
    viewReceipt: "查看收据",
    option: "选项",
    pleaseReviewYourSelection: "请检查您的选择",
  },
  ja: {
    menu: "メニュー", categories: "カテゴリー", all: "すべて", popular: "人気",
    addToCart: "選択に追加", added: "追加済み!", cart: "カート", yourCart: "私の選択",
    emptyCart: "カートは空です", emptyCartDesc: "メニューを見て料理を追加してください",
    browseMenu: "メニューを見る", quantity: "数量", specialInstructions: "特別なご要望は?",
    note: "メモ", orderNote: "注文メモ", orderNotePlaceholder: "注文全体へのメモ（アレルギー、好みなど）",
    subtotal: "小計", total: "合計", checkout: "注文する",
    placeOrder: "注文を確定", placing: "処理中...", orderPlaced: "注文完了！",
    orderSuccess: "ご注文が正常に完了しました", orderNumber: "注文番号",
    orderSummary: "注文内容", scanQR: "続行するには、この QR コードをウェイターに見せてください",
    backToMenu: "メニューに戻る", trackOrder: "注文を追跡", guestCheckout: "ゲスト注文",
    nameOptional: "お名前", tableOptional: "テーブル番号",
    namePlaceholder: "例: 田中", tablePlaceholder: "例: 12",
    items: "点", item: "点", remove: "削除", close: "閉じる",
    orderDetails: "注文詳細", status: "ステータス",
    pending: "待機中", preparing: "準備中", ready: "お受け取り可能",
    completed: "完了", cancelled: "キャンセル",
    placedAt: "注文日時", customer: "お客様", table: "テーブル",
    language: "言語", darkMode: "ダークモード", lightMode: "ライトモード",
    searchMenu: "料理を検索...", noResults: "料理が見つかりません", viewOrder: "選択を見る",
    optional: "任意", continueToPayment: "確認して注文",
    guestInfo: "ゲスト情報", yourOrder: "ご注文", orderHistory: "注文履歴", recentOrder: "最近のご注文", more: "もっと",
    featured: "おすすめ",
    no_past_orders: "過去の注文はありません",
    orders_placeholder: "ここに注文が表示されます",
    historyPlaced: "注文が完了しました",
    viewReceipt: "領収書を表示",
    option: "オプション",
    pleaseReviewYourSelection: "選択内容をご確認ください",
  },
  ko: {
    menu: "메뉴", categories: "카테고리", all: "전체", popular: "인기",
    addToCart: "선택에 추가", added: "추가됨!", cart: "장바구니", yourCart: "내 선택",
    emptyCart: "장바구니가 비어 있습니다", emptyCartDesc: "메뉴를 둘러보고 음식을 추가하세요",
    browseMenu: "메뉴 보기", quantity: "수량", specialInstructions: "특별 요청 사항?",
    note: "메모", orderNote: "주문 메모", orderNotePlaceholder: "전체 주문에 대한 메모 (알레르기, 기호 등)",
    subtotal: "소계", total: "합계", checkout: "주문하기",
    placeOrder: "주문 확정", placing: "처리 중...", orderPlaced: "주문 완료!",
    orderSuccess: "주문이 성공적으로 완료되었습니다", orderNumber: "주문 번호",
    orderSummary: "주문 요약", scanQR: "계속하려면 이 QR 코드를 웨이터에게 보여주세요",
    backToMenu: "메뉴로 돌아가기", trackOrder: "주문 추적", guestCheckout: "비회원 주문",
    nameOptional: "이름", tableOptional: "테이블 번호",
    namePlaceholder: "예: 홍길동", tablePlaceholder: "예: 12",
    items: "개", item: "개", remove: "삭제", close: "닫기",
    orderDetails: "주문 상세", status: "상태",
    pending: "대기 중", preparing: "준비 중", ready: "수령 가능",
    completed: "완료", cancelled: "취소됨",
    placedAt: "주문 시간", customer: "고객", table: "테이블",
    language: "언어", darkMode: "다크 모드", lightMode: "라이트 모드",
    searchMenu: "메뉴 검색...", noResults: "항목을 찾을 수 없습니다", viewOrder: "선택 보기",
    optional: "선택사항", continueToPayment: "확인 및 주문",
    guestInfo: "게스트 정보", yourOrder: "내 주문", orderHistory: "주문 내역", recentOrder: "최근 주문", more: "더보기",
    featured: "추천",
    no_past_orders: "이전 주문이 없습니다",
    orders_placeholder: "주문한 항목이 여기에 표시됩니다",
    historyPlaced: "주문이 접수되었습니다",
    viewReceipt: "영수증 보기",
    option: "옵션",
    pleaseReviewYourSelection: "선택을 검토해 주세요",
  },
  ru: {
    menu: "Меню", categories: "Категории", all: "Все", popular: "Популярное",
    addToCart: "Добавить в выбор", added: "Добавлено!", cart: "Корзина", yourCart: "Мои выборы",
    emptyCart: "Корзина пуста", emptyCartDesc: "Просмотрите меню и добавьте блюда",
    browseMenu: "Смотреть меню", quantity: "Количество", specialInstructions: "Особые пожелания?",
    note: "Заметка к блюду", orderNote: "Заметка к заказу", orderNotePlaceholder: "Заметки к заказу (аллергии, предпочтения...)",
    subtotal: "Подытог", total: "Итого", checkout: "Оформить",
    placeOrder: "Разместить заказ", placing: "Обработка...", orderPlaced: "Заказ размещён!",
    orderSuccess: "Ваш заказ успешно размещён", orderNumber: "Номер заказа",
    orderSummary: "Сводка заказа", scanQR: "Покажите этот QR-код своему официанту, чтобы продолжить",
    backToMenu: "Назад в меню", trackOrder: "Отследить заказ", guestCheckout: "Заказ без регистрации",
    nameOptional: "Ваше имя", tableOptional: "Номер стола",
    namePlaceholder: "напр. Иван", tablePlaceholder: "напр. 12",
    items: "позиций", item: "позиция", remove: "Удалить", close: "Закрыть",
    orderDetails: "Детали заказа", status: "Статус",
    pending: "Ожидание", preparing: "Готовится", ready: "Готово к выдаче",
    completed: "Завершён", cancelled: "Отменён",
    placedAt: "Оформлен", customer: "Клиент", table: "Стол",
    language: "Язык", darkMode: "Тёмный режим", lightMode: "Светлый режим",
    searchMenu: "Поиск блюд...", noResults: "Ничего не найдено", viewOrder: "Посмотреть выбор",
    optional: "необязательно", continueToPayment: "Проверить и заказать",
    guestInfo: "Данные гостя", yourOrder: "Ваш заказ", orderHistory: "История заказов", recentOrder: "Ваши недавние заказы 주문", more: "ещё",
    featured: "рекомендуемое",
    no_past_orders: "Нет прошлых заказов",
    orders_placeholder: "Ваши заказы будут отображаться здесь",
    historyPlaced: "Заказ оформлен",
    viewReceipt: "Просмотреть чек",
    option: "Опция",
    pleaseReviewYourSelection: "Пожалуйста, проверьте ваш выбор",
  },
  fil: {
    menu: "Menu", categories: "Mga Kategorya", all: "Lahat", popular: "Sikat",
    addToCart: "Idagdag sa Pinili", added: "Naidagdag!", cart: "Cart", yourCart: "Aking mga Pinili",
    emptyCart: "Walang laman ang iyong cart", emptyCartDesc: "Mag-browse ng menu at magdagdag ng pagkain",
    browseMenu: "Tingnan ang Menu", quantity: "Dami", specialInstructions: "Espesyal na kahilingan?",
    note: "Tala ng aytem", orderNote: "Tala ng order", orderNotePlaceholder: "Mga tala para sa buong order (allergy, kagustuhan...)",
    subtotal: "Subtotal", total: "Kabuuan", checkout: "Mag-checkout",
    placeOrder: "Mag-order", placing: "Nagpo-proseso...", orderPlaced: "Nai-order na!",
    orderSuccess: "Matagumpay na nailagay ang iyong order", orderNumber: "Numero ng Order",
    orderSummary: "Buod ng Order", scanQR: "Ipakita ang QR code na ito sa iyong waiter upang magpatuloy",
    backToMenu: "Bumalik sa Menu", trackOrder: "Subaybayan ang Order", guestCheckout: "Guest Checkout",
    nameOptional: "Iyong pangalan", tableOptional: "Numero ng mesa",
    namePlaceholder: "hal. Juan", tablePlaceholder: "hal. 12",
    items: "mga aytem", item: "aytem", remove: "Alisin", close: "Isara",
    orderDetails: "Detalye ng Order", status: "Katayuan",
    pending: "Nakabinbin", preparing: "Inihahanda", ready: "Handa na",
    completed: "Tapos na", cancelled: "Kinansela",
    placedAt: "Inorder noong", customer: "Customer", table: "Mesa",
    language: "Wika", darkMode: "Dark Mode", lightMode: "Light Mode",
    searchMenu: "Maghanap sa menu...", noResults: "Walang nahanap", viewOrder: "Tingnan ang pinili",
    optional: "opsyonal", continueToPayment: "Suriin at mag-order",
    guestInfo: "Impormasyon ng Guest", yourOrder: "Iyong Order", orderHistory: "Kasaysayan ng Order", recentOrder: "Ang iyong mga kamakailang order", more: "higit pa",
    featured: "itinatampok",
    no_past_orders: "Walang nakaraang mga order",
    orders_placeholder: "Lalabas dito ang iyong mga order",
    historyPlaced: "Nailagay na ang order",
    viewReceipt: "Tingnan ang resibo",
    option: "Pagpipilian",
    pleaseReviewYourSelection: "Pakisuri ang iyong napili",
  }
};


const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem("menu_lang") || "en");

  useEffect(() => {
    localStorage.setItem("menu_lang", lang);
  }, [lang]);

  const t = (key) =>
    translations[lang]?.[key] ||
    translations.en?.[key] ||
    key;

  // const getLocalizedField = (item, field) => {
  //   if (!item) return "";

  //   const value = item[field];

  //   if (typeof value === "object" && value !== null) {
  //     return value[lang] || value.en || "";
  //   }

  //   if (item[`${field}_${lang}`]) return item[`${field}_${lang}`];
  //   if (item[`${field}_en`]) return item[`${field}_en`];

  //   if (typeof value === "string") return value;

  //   return "";
  // };


  const getLocalizedField = (item, field) => {
    if (!item) return "";

    const value = item[field];

    // ✅ case: object with translations
    if (typeof value === "object" && value !== null) {
      return (
        value[lang] ||      // current language
        value.en ||         // fallback to English
        value.def ||        // fallback to default (VERY IMPORTANT)
        Object.values(value).find(v => v) || // first non-empty
        ""
      );
    }

    // ✅ legacy flat fields
    if (item[`${field}_${lang}`]) return item[`${field}_${lang}`];
    if (item[`${field}_en`]) return item[`${field}_en`];

    // ✅ plain string
    if (typeof value === "string") return value;

    return "";
  };
  return (
    <LanguageContext.Provider value={{ lang, setLang, t, getLocalizedField }}>
      {children}
    </LanguageContext.Provider>
  );
}

// ✅ ADD THIS
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}