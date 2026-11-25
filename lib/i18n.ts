/**
 * English / Arabic strings. `t(lang, key, vars)` — {name} placeholders are filled from vars.
 * The language is kept in the "fitted_lang" cookie; Arabic switches the page to RTL.
 */
export type Lang = "en" | "ar";
export const LANG_COOKIE = "fitted_lang";
export const dirOf = (lang: Lang) => (lang === "ar" ? "rtl" : "ltr");

const en = {
  // navigation
  "nav.home": "Home", "nav.closet": "Closet", "nav.profile": "My profile", "nav.favorites": "Favorites", "nav.bag": "Bag",
  "nav.about": "About the model", "nav.tryon": "Virtual try-on", "nav.settings": "Profile & settings", "nav.logout": "Log out",
  "nav.menu": "Menu", "nav.bagAria": "Shopping bag", "nav.lang": "العربية",
  // common
  "c.view": "View", "c.tryon": "Try on", "c.addToBag": "Add to bag", "c.adding": "Adding…", "c.remove": "Remove",
  "c.clear": "Clear", "c.close": "Close", "c.saveChanges": "Save changes", "c.backToCloset": "Back to closet",
  "c.front": "Front", "c.back": "Back", "c.size": "Size", "c.colour": "Colour", "c.quantity": "Quantity",
  "c.less": "Less", "c.more": "More", "c.somethingWrong": "Something went wrong.",
  "tagline": "Your style, your fit, your way.",
  // toasts
  "t.savedFav": "Saved to favorites", "t.removedFav": "Removed from favorites", "t.addedBag": "Added to bag — {name} · {size}",
  "t.pickSize": "Please select a size first", "t.chooseSize": "Choose a size to add this piece", "t.removedBag": "Removed from bag",
  "t.orderPlaced": "Order {id} placed", "t.profileUpdated": "Profile updated", "t.imageUpdated": "Profile image updated",
  "t.imageRemoved": "Profile image removed", "t.sizesSaved": "Sizes saved", "t.pwUpdated": "Password updated — other devices were signed out",
  "t.signedOutAll": "Signed out of all devices", "t.deleted": "Account deleted", "t.imageTooBig": "That image is larger than 8 MB",
  "t.addFirst": "Please add {what} first", "t.yourPhoto": "your photo", "t.aGarment": "a garment", "t.and": "and",
  // home
  "home.eyebrow": "FITTED · New season", "home.welcome": "Welcome", "home.welcomeBack": "Welcome back",
  "home.explore": "Explore collection", "home.railEyebrow": "New season · Ten pieces on the rail",
  "home.railHeading": "A clothing rail you can handle, right on the page.",
  "home.railCaption": "Brush along the rail, slide a hanger, click a piece to see it up close.", "home.shopEdit": "Shop the edit",
  "home.editEyebrow": "The edit", "home.editTitle": "Picked for this week", "home.tryEyebrow": "Virtual try-on",
  "home.tryTitle": "See it on you before it's yours", "status.connected": "Try-on model connected", "status.pending": "{model} integration pending",
  "home.s1t": "Choose a piece", "home.s1": "Open any product and press Try on. The garment photo travels with you.",
  "home.s2t": "Upload your photo", "home.s2": "A clear, front-facing full-body photo. We check size, light and focus first.",
  "home.s3t": "Generate", "home.s3": "{model}, a diffusion model for virtual try-on, dresses your photo in the garment.",
  "home.aboutLink": "How the model works",
  // closet
  "closet.eyebrow": "The closet", "closet.title": "Everything on the rail.", "closet.all": "All",
  "closet.search": "Search the closet — e.g. knit, oxford, olive", "closet.clearSearch": "Clear search",
  "closet.sort.featured": "Featured", "closet.sort.low": "Price: low to high", "closet.sort.high": "Price: high to low", "closet.sort.name": "Name",
  "closet.count": "{n} of {total} pieces", "closet.emptyT": "Nothing matches", "closet.empty": "Try clearing a filter or searching for something else.",
  // product
  "p.dragHint": "Drag to turn · double-click for the back", "p.savedSize": " · your saved size", "p.sizeGuide": "Size guide",
  "p.delivery": "Free delivery in Saudi Arabia on orders over SAR 500 · Returns within 14 days", "p.more": "You may also like",
  "p.guideText": "Body measurements in cm — regular fit. Between sizes? Size up for a relaxed look.",
  "p.chest": "Chest", "p.length": "Length", "p.sleeve": "Sleeve",
  "p.favAdd": "Save to favorites", "p.favRemove": "Remove from favorites",
  // try-on
  "to.eyebrow": "Virtual try-on", "to.title": "See it on you.", "to.step1": "Your photo", "to.step2": "Garment", "to.step3": "Your look",
  "to.photoHelp": "A well-lit, front-facing photo with your full body (or at least your upper body), arms slightly away from the body, plain background. JPG, PNG or WEBP, up to 10 MB.",
  "to.drop": "Drag & drop your photo here", "to.or": "or", "to.browse": "browse files", "to.checking": "Checking your photo…",
  "to.rejected": "This photo can't be used — fix the points marked ✕.", "to.removePhoto": "Remove photo",
  "to.choose": "Choose a garment…", "to.selected": "Selected garment", "to.category": "Garment category",
  "to.none": "No garment selected", "to.noneText": "Choose one above, or press Try on on any product.", "to.browseCloset": "Browse the closet",
  "to.generate": "Generate try-on", "to.preparing": "Preparing…", "to.preparingLong": "Preparing your virtual try-on experience…",
  "to.pending": "Integration pending", "to.ready": "Your images are ready for AI processing.",
  "to.readyPhoto": "Your photo — prepared at {w}×{h}", "to.readyGarment": "Garment — {name}", "to.readyCat": "Category",
  "to.nextPhase": "{model} integration will be connected in the next development phase. No try-on image has been generated.",
  "to.modelStatus": "Model status: {model} integration pending.", "to.learn": "How it works",
  "to.cat.upper_body": "Upper body — tops, shirts, knitwear, jackets", "to.cat.lower_body": "Lower body — trousers, skirts, shorts",
  "to.cat.dresses": "Dresses — full-length pieces",
  "to.chk.format": "JPG, PNG or WEBP format", "to.chk.big": "File is larger than 10 MB", "to.chk.res": "At least {mw}×{mh} px (yours: {w}×{h})",
  "to.chk.portrait": "Portrait orientation (taller than wide)", "to.chk.light": "Well lit", "to.chk.focus": "In focus", "to.chk.read": "File is a readable image",
  "rv.generated": "Generated look", "rv.noResult": "No try-on result yet",
  "rv.noResultText": "The generated image will appear here, with a before / after comparison, once the model is connected.",
  "rv.result": "Result", "rv.compare": "Before / After", "rv.before": "Before", "rv.after": "After", "rv.download": "Download",
  "rv.downloadOff": "Available once a real try-on result exists", "rv.another": "Try another",
  "to.reach": "Couldn't reach the server.", "to.failed": "Try-on failed.",
  // favorites
  "fav.eyebrow": "Favorites", "fav.title": "Saved for later.", "fav.count": "{n} saved", "fav.emptyT": "No favorites yet",
  "fav.empty": "Tap the heart on any piece to keep it here.", "fav.cta": "Explore the closet",
  "fav.savedSize": "Adds your saved size ({size})", "fav.noSize": "Choose a size on the product page",
  // bag
  "bag.eyebrow": "Shopping bag", "bag.title": "Your bag.", "bag.emptyT": "Your bag is empty", "bag.empty": "Pieces you add will wait for you here.",
  "bag.continue": "Continue shopping", "bag.summary": "Order summary", "bag.subtotal": "Subtotal ({n} items)", "bag.shipping": "Shipping estimate",
  "bag.free": "Free", "bag.total": "Total", "bag.away": "{amount} away from free delivery",
  "bag.note": "Free delivery in Saudi Arabia on orders over {amount}. Prices include VAT.", "bag.checkout": "Checkout",
  "bag.confirm": "Confirm order", "bag.proto": "This is a prototype: no payment is taken and nothing will be shipped. Placing the order records it in your order history.",
  "bag.place": "Place order", "bag.placing": "Placing…", "bag.items": "items", "bag.sizeLine": "Size {size}",
  // profile
  "pr.eyebrow": "My profile", "pr.since": "Member since {date}", "pr.tab.profile": "Profile", "pr.tab.sizes": "Saved sizes",
  "pr.tab.history": "Try-on history", "pr.tab.orders": "Orders", "pr.tab.settings": "Account settings",
  "pr.name": "Full name", "pr.email": "Email", "pr.removeImage": "Remove profile image", "pr.changeImage": "Change profile image",
  "pr.sizesHelp": "Used to pre-select your size on product pages and for quick add-to-bag from Favorites.",
  "pr.tops": "Tops", "pr.bottoms": "Bottoms", "pr.dresses": "Dresses & long coats", "pr.notSet": "Not set", "pr.saveSizes": "Save sizes",
  "pr.noHistoryT": "No try-on results yet", "pr.noHistory": "Real try-on results will be saved here once the model is connected and you generate a look.",
  "pr.noOrders": "No orders yet. Orders you place appear here.", "pr.changePw": "Change password", "pr.currentPw": "Current password",
  "pr.newPw": "New password", "pr.confirmPw": "Confirm new password", "pr.updatePw": "Update password", "pr.signOutAll": "Sign out of all devices",
  "pr.delete": "Delete account", "pr.deleteText": "Permanently removes your profile, bag, favorites, orders and saved images. This can't be undone.",
  "pr.typeDelete": "Type DELETE to confirm", "pr.deleteBtn": "Delete my account", "pr.orderLine": "{name} — size {size} × {qty} · {amount}",
  // auth
  "a.welcomeBack": "Welcome back", "a.loginTitle": "Log in to your closet", "a.email": "Email", "a.password": "Password",
  "a.remember": "Remember me", "a.forgot": "Forgot password?", "a.login": "Log in", "a.loggingIn": "Logging in…",
  "a.new": "New to FITTED?", "a.create": "Create an account", "a.join": "Join FITTED", "a.signupTitle": "Create your account",
  "a.fullName": "Full name", "a.confirm": "Confirm password", "a.pwRule": "At least 8 characters, with a letter and a number.",
  "a.pwNeeds": "Needs {list}", "a.noMatch": "Passwords don't match", "a.createBtn": "Create account", "a.creating": "Creating…",
  "a.have": "Already have an account?", "a.hashNote": "Passwords are stored as salted PBKDF2-SHA256 hashes, never in plain text.",
  "a.enterBoth": "Please enter your email and password.", "a.resetTitle": "Reset your password", "a.accountEmail": "Account email",
  "a.sendReset": "Send reset link", "a.resetInfo": "Password-reset emails aren't connected in this prototype, so no email was sent. Once an email service is configured, a one-time reset link will be sent to this address.",
  "a.showPw": "Show password", "a.hidePw": "Hide password", "a.aboutLink": "About the try-on model",
  // footer
  "f.tagline": "Your style, your fit, your way. See it on you before it's yours.", "f.shop": "Shop", "f.tryon": "Try-on", "f.service": "Service",
  "f.freeDelivery": "Free delivery over SAR 500", "f.returns": "14-day returns", "f.sizes": "XS – XXL in every piece", "f.proto": "Prototype",
  // 404
  "nf.title": "This piece has left the rail.", "nf.back": "Back to the closet",
} as const;

export type Key = keyof typeof en;

const ar: Record<Key, string> = {
  "nav.home": "الرئيسية", "nav.closet": "الخزانة", "nav.profile": "حسابي", "nav.favorites": "المفضلة", "nav.bag": "السلة",
  "nav.about": "عن الموديل", "nav.tryon": "التجربة الافتراضية", "nav.settings": "الحساب والإعدادات", "nav.logout": "تسجيل الخروج",
  "nav.menu": "القائمة", "nav.bagAria": "سلة التسوق", "nav.lang": "English",
  "c.view": "عرض", "c.tryon": "جرّبها", "c.addToBag": "أضف للسلة", "c.adding": "جاري الإضافة…", "c.remove": "إزالة",
  "c.clear": "مسح", "c.close": "إغلاق", "c.saveChanges": "حفظ التغييرات", "c.backToCloset": "الرجوع للخزانة",
  "c.front": "الأمام", "c.back": "الخلف", "c.size": "المقاس", "c.colour": "اللون", "c.quantity": "الكمية",
  "c.less": "أقل", "c.more": "أكثر", "c.somethingWrong": "صار خطأ، حاول مرة ثانية.",
  "tagline": "ستايلك، مقاسك، على طريقتك.",
  "t.savedFav": "انحفظت في المفضلة", "t.removedFav": "انشالت من المفضلة", "t.addedBag": "انضافت للسلة — {name} · {size}",
  "t.pickSize": "اختر المقاس أول", "t.chooseSize": "اختر المقاس عشان تضيف القطعة", "t.removedBag": "انشالت من السلة",
  "t.orderPlaced": "تم الطلب {id}", "t.profileUpdated": "تم تحديث الحساب", "t.imageUpdated": "تم تحديث الصورة",
  "t.imageRemoved": "انشالت الصورة", "t.sizesSaved": "انحفظت المقاسات", "t.pwUpdated": "تم تغيير كلمة المرور — وطلعنا من باقي الأجهزة",
  "t.signedOutAll": "تم تسجيل الخروج من كل الأجهزة", "t.deleted": "انحذف الحساب", "t.imageTooBig": "الصورة أكبر من 8 ميقا",
  "t.addFirst": "أضف {what} أول", "t.yourPhoto": "صورتك", "t.aGarment": "قطعة", "t.and": "و",
  "home.eyebrow": "FITTED · موسم جديد", "home.welcome": "أهلاً", "home.welcomeBack": "أهلاً من جديد",
  "home.explore": "استكشف التشكيلة", "home.railEyebrow": "موسم جديد · عشر قطع على العلّاقة",
  "home.railHeading": "علّاقة ملابس تقدر تلمسها، هنا في الصفحة.",
  "home.railCaption": "مرّر على العلّاقة، حرّك الشمّاعات، واضغط على أي قطعة تشوفها عن قرب.", "home.shopEdit": "تسوّق التشكيلة",
  "home.editEyebrow": "اختياراتنا", "home.editTitle": "مختارات هالأسبوع", "home.tryEyebrow": "التجربة الافتراضية",
  "home.tryTitle": "شوفها عليك قبل ما تشتريها", "status.connected": "موديل التجربة متصل", "status.pending": "ربط {model} قيد التنفيذ",
  "home.s1t": "اختر قطعة", "home.s1": "افتح أي منتج واضغط «جرّبها»، وصورة القطعة تنتقل معك.",
  "home.s2t": "ارفع صورتك", "home.s2": "صورة واضحة من الأمام للجسم كامل. نتأكد من المقاس والإضاءة والوضوح قبل.",
  "home.s3t": "ولّد اللوك", "home.s3": "{model}، موديل diffusion للتجربة الافتراضية، يلبّسك القطعة في صورتك.",
  "home.aboutLink": "كيف يشتغل الموديل",
  "closet.eyebrow": "الخزانة", "closet.title": "كل القطع على العلّاقة.", "closet.all": "الكل",
  "closet.search": "ابحث في الخزانة — مثلاً تريكو، أكسفورد، زيتي", "closet.clearSearch": "مسح البحث",
  "closet.sort.featured": "المميّز", "closet.sort.low": "السعر: من الأقل", "closet.sort.high": "السعر: من الأعلى", "closet.sort.name": "الاسم",
  "closet.count": "{n} من {total} قطعة", "closet.emptyT": "ما فيه نتائج", "closet.empty": "جرّب تمسح فلتر أو تبحث عن شي ثاني.",
  "p.dragHint": "اسحب عشان تلفّها · دبل كليك للخلف", "p.savedSize": " · مقاسك المحفوظ", "p.sizeGuide": "دليل المقاسات",
  "p.delivery": "توصيل مجاني داخل السعودية للطلبات فوق 500 ر.س · إرجاع خلال 14 يوم", "p.more": "ممكن يعجبك بعد",
  "p.guideText": "مقاسات الجسم بالسنتيمتر — قصّة عادية. بين مقاسين؟ خذ الأكبر للبسة مريحة.",
  "p.chest": "الصدر", "p.length": "الطول", "p.sleeve": "الكم",
  "p.favAdd": "احفظ في المفضلة", "p.favRemove": "شيلها من المفضلة",
  "to.eyebrow": "التجربة الافتراضية", "to.title": "شوفها عليك.", "to.step1": "صورتك", "to.step2": "القطعة", "to.step3": "اللوك",
  "to.photoHelp": "صورة بإضاءة حلوة من الأمام لجسمك كامل (أو على الأقل النص العلوي)، اليدين بعيدة شوي عن الجسم، وخلفية سادة. JPG أو PNG أو WEBP، لين 10 ميقا.",
  "to.drop": "اسحب صورتك وحطها هنا", "to.or": "أو", "to.browse": "اختر من الجهاز", "to.checking": "نتأكد من الصورة…",
  "to.rejected": "ما نقدر نستخدم هالصورة — صلّح النقاط اللي عليها ✕.", "to.removePhoto": "إزالة الصورة",
  "to.choose": "اختر قطعة…", "to.selected": "القطعة المختارة", "to.category": "نوع القطعة",
  "to.none": "ما اخترت قطعة", "to.noneText": "اختر وحدة من فوق، أو اضغط «جرّبها» على أي منتج.", "to.browseCloset": "تصفّح الخزانة",
  "to.generate": "ولّد التجربة", "to.preparing": "جاري التجهيز…", "to.preparingLong": "نجهّز لك تجربتك الافتراضية…",
  "to.pending": "الربط قيد التنفيذ", "to.ready": "صورك جاهزة للمعالجة بالذكاء الاصطناعي.",
  "to.readyPhoto": "صورتك — مجهّزة بمقاس {w}×{h}", "to.readyGarment": "القطعة — {name}", "to.readyCat": "النوع",
  "to.nextPhase": "ربط {model} بيكون في المرحلة الجاية من التطوير. ما تم توليد أي صورة.",
  "to.modelStatus": "حالة الموديل: ربط {model} قيد التنفيذ.", "to.learn": "كيف يشتغل",
  "to.cat.upper_body": "الجزء العلوي — تيشيرتات، قمصان، تريكو، جاكيتات", "to.cat.lower_body": "الجزء السفلي — بناطيل، تنانير، شورتات",
  "to.cat.dresses": "فساتين — قطع طويلة",
  "to.chk.format": "صيغة JPG أو PNG أو WEBP", "to.chk.big": "الملف أكبر من 10 ميقا", "to.chk.res": "على الأقل {mw}×{mh} بكسل (صورتك: {w}×{h})",
  "to.chk.portrait": "صورة طولية (الطول أكبر من العرض)", "to.chk.light": "إضاءة كافية", "to.chk.focus": "واضحة ومو مغبّشة", "to.chk.read": "ملف صورة يُقرأ",
  "rv.generated": "اللوك الناتج", "rv.noResult": "ما فيه نتيجة للحين",
  "rv.noResultText": "الصورة الناتجة بتطلع هنا، مع مقارنة قبل وبعد، أول ما يتربط الموديل.",
  "rv.result": "النتيجة", "rv.compare": "قبل / بعد", "rv.before": "قبل", "rv.after": "بعد", "rv.download": "تحميل",
  "rv.downloadOff": "يتفعّل لما تكون فيه نتيجة حقيقية", "rv.another": "جرّب قطعة ثانية",
  "to.reach": "ما قدرنا نوصل للسيرفر.", "to.failed": "فشلت التجربة.",
  "fav.eyebrow": "المفضلة", "fav.title": "محفوظة لبعدين.", "fav.count": "{n} محفوظة", "fav.emptyT": "ما عندك مفضلة للحين",
  "fav.empty": "اضغط على القلب في أي قطعة عشان تنحفظ هنا.", "fav.cta": "استكشف الخزانة",
  "fav.savedSize": "تنضاف بمقاسك المحفوظ ({size})", "fav.noSize": "اختر المقاس من صفحة المنتج",
  "bag.eyebrow": "سلة التسوق", "bag.title": "سلتك.", "bag.emptyT": "سلتك فاضية", "bag.empty": "القطع اللي تضيفها بتنتظرك هنا.",
  "bag.continue": "كمّل التسوق", "bag.summary": "ملخص الطلب", "bag.subtotal": "المجموع ({n} قطع)", "bag.shipping": "تقدير الشحن",
  "bag.free": "مجاني", "bag.total": "الإجمالي", "bag.away": "باقي {amount} على التوصيل المجاني",
  "bag.note": "توصيل مجاني داخل السعودية للطلبات فوق {amount}. الأسعار شاملة الضريبة.", "bag.checkout": "إتمام الطلب",
  "bag.confirm": "تأكيد الطلب", "bag.proto": "هذا نموذج تجريبي: ما فيه دفع ولا شحن. الطلب ينحفظ في سجل طلباتك بس.",
  "bag.place": "اطلب", "bag.placing": "جاري الطلب…", "bag.items": "قطع", "bag.sizeLine": "المقاس {size}",
  "pr.eyebrow": "حسابي", "pr.since": "عضو من {date}", "pr.tab.profile": "الحساب", "pr.tab.sizes": "مقاساتي",
  "pr.tab.history": "سجل التجارب", "pr.tab.orders": "الطلبات", "pr.tab.settings": "الإعدادات",
  "pr.name": "الاسم الكامل", "pr.email": "الإيميل", "pr.removeImage": "إزالة الصورة", "pr.changeImage": "تغيير الصورة",
  "pr.sizesHelp": "نستخدمها نختار مقاسك تلقائياً في صفحة المنتج، وللإضافة السريعة للسلة من المفضلة.",
  "pr.tops": "الأعلى", "pr.bottoms": "الأسفل", "pr.dresses": "فساتين ومعاطف طويلة", "pr.notSet": "غير محدد", "pr.saveSizes": "حفظ المقاسات",
  "pr.noHistoryT": "ما فيه تجارب للحين", "pr.noHistory": "نتائج التجربة الحقيقية بتنحفظ هنا أول ما يتربط الموديل وتولّدن لوك.",
  "pr.noOrders": "ما عندك طلبات للحين. طلباتك بتطلع هنا.", "pr.changePw": "تغيير كلمة المرور", "pr.currentPw": "كلمة المرور الحالية",
  "pr.newPw": "كلمة المرور الجديدة", "pr.confirmPw": "تأكيد كلمة المرور الجديدة", "pr.updatePw": "تحديث كلمة المرور", "pr.signOutAll": "تسجيل الخروج من كل الأجهزة",
  "pr.delete": "حذف الحساب", "pr.deleteText": "يحذف حسابك وسلتك ومفضلتك وطلباتك وصورك نهائياً. ما يمكن التراجع.",
  "pr.typeDelete": "اكتب DELETE للتأكيد", "pr.deleteBtn": "احذف حسابي", "pr.orderLine": "{name} — مقاس {size} × {qty} · {amount}",
  "a.welcomeBack": "أهلاً من جديد", "a.loginTitle": "سجّل دخولك لخزانتك", "a.email": "الإيميل", "a.password": "كلمة المرور",
  "a.remember": "تذكّرني", "a.forgot": "نسيت كلمة المرور؟", "a.login": "تسجيل الدخول", "a.loggingIn": "جاري الدخول…",
  "a.new": "جديد على FITTED؟", "a.create": "أنشئ حساب", "a.join": "انضم لـ FITTED", "a.signupTitle": "أنشئ حسابك",
  "a.fullName": "الاسم الكامل", "a.confirm": "تأكيد كلمة المرور", "a.pwRule": "8 أحرف على الأقل، فيها حرف ورقم.",
  "a.pwNeeds": "تحتاج {list}", "a.noMatch": "كلمتين المرور مو متطابقة", "a.createBtn": "إنشاء الحساب", "a.creating": "جاري الإنشاء…",
  "a.have": "عندك حساب؟", "a.hashNote": "كلمات المرور تنحفظ مشفّرة (PBKDF2-SHA256)، وما تنحفظ كنص أبداً.",
  "a.enterBoth": "اكتب الإيميل وكلمة المرور.", "a.resetTitle": "استرجاع كلمة المرور", "a.accountEmail": "إيميل الحساب",
  "a.sendReset": "أرسل رابط الاسترجاع", "a.resetInfo": "إرسال الإيميلات مو مفعّل في النموذج التجريبي، فما انرسل شي. أول ما تتفعّل خدمة الإيميل، بيوصل رابط استرجاع لهذا الإيميل.",
  "a.showPw": "إظهار كلمة المرور", "a.hidePw": "إخفاء كلمة المرور", "a.aboutLink": "عن موديل التجربة",
  "f.tagline": "ستايلك، مقاسك، على طريقتك. شوفها عليك قبل ما تشتريها.", "f.shop": "تسوّق", "f.tryon": "التجربة", "f.service": "الخدمة",
  "f.freeDelivery": "توصيل مجاني فوق 500 ر.س", "f.returns": "إرجاع خلال 14 يوم", "f.sizes": "من XS لين XXL لكل قطعة", "f.proto": "نموذج تجريبي",
  "nf.title": "هالقطعة طلعت من العلّاقة.", "nf.back": "الرجوع للخزانة",
};

const DICTS: Record<Lang, Record<Key, string>> = { en, ar };

export function t(lang: Lang, key: Key, vars?: Record<string, string | number>): string {
  let s = DICTS[lang][key] ?? en[key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
  return s;
}

/** Server error messages (English) -> Arabic. */
const ERRORS_AR: Record<string, string> = {
  "Please log in again.": "سجّل دخولك مرة ثانية.",
  "Please enter your email.": "اكتب إيميلك.",
  "Please enter a valid email address.": "اكتب إيميل صحيح.",
  "Please enter your full name.": "اكتب اسمك الكامل.",
  "Name is too long.": "الاسم طويل مرة.",
  "Passwords don't match.": "كلمتين المرور مو متطابقة.",
  "An account with this email already exists. Try logging in.": "فيه حساب بهالإيميل. جرّب تسجّل دخول.",
  "Please enter your email and password.": "اكتب الإيميل وكلمة المرور.",
  "Incorrect email or password.": "الإيميل أو كلمة المرور غلط.",
  "Please select a size.": "اختر المقاس.",
  "This product is no longer available.": "هالقطعة مو متوفرة.",
  "Your bag is empty.": "سلتك فاضية.",
  "Current password is incorrect.": "كلمة المرور الحالية غلط.",
  "New passwords don't match.": "كلمتين المرور الجديدة مو متطابقة.",
  "Another account already uses this email.": "فيه حساب ثاني يستخدم هالإيميل.",
  "That image is too large.": "الصورة كبيرة مرة.",
  "Please add your photo.": "أضف صورتك.",
  "Please choose a garment.": "اختر قطعة.",
  "The photo is too large.": "الصورة كبيرة مرة.",
  "Something went wrong.": "صار خطأ، حاول مرة ثانية.",
};

export function translateError(message: string, lang: Lang): string {
  if (lang !== "ar") return message;
  if (ERRORS_AR[message]) return ERRORS_AR[message];
  const m = message.match(/^(New )?[Pp]assword needs (.+)\.$/);
  if (m) {
    const parts = m[2].replace("at least 8 characters", "8 أحرف على الأقل").replace("a letter", "حرف").replace("a number", "رقم").replace(/, /g, "، ");
    return `${m[1] ? "كلمة المرور الجديدة" : "كلمة المرور"} تحتاج ${parts}.`;
  }
  return message;
}

export function formatSAR(amount: number, lang: Lang = "en"): string {
  const n = amount.toLocaleString("en-US", { maximumFractionDigits: 2 });
  return lang === "ar" ? `${n} ر.س` : `SAR ${n}`;
}
