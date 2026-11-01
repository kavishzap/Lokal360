import type { Locale } from "@/i18n/locales";

const fr: Record<string, string> = {
  Language: "Langue",
  "Restaurant back office": "Back-office du restaurant",
  "Back office": "Back-office",
  Administrator: "Administrateur",
  Account: "Compte",
  Profile: "Profil",
  Settings: "Paramètres",
  Logout: "Déconnexion",
  Cancel: "Annuler",
  Delete: "Supprimer",
  Dashboard: "Tableau de bord",
  "Restaurant Management": "Gestion du restaurant",
  Restaurant: "Restaurant",
  Zones: "Zones",
  Tables: "Tables",
  Categories: "Catégories",
  Units: "Unités",
  Ingredients: "Ingrédients",
  "Menu Items": "Articles du menu",
  Orders: "Commandes",
  Inventory: "Stock",
  "Balance Inventory": "Contrôle du stock",
  "Balance inventory": "Contrôle du stock",
  Accounting: "Comptabilité",
  Purchases: "Achats",
  Expenses: "Dépenses",
  Assets: "Immobilisations",
  "Chart of Accounts": "Plan comptable",
  "Journal Book": "Journal",
  Ledger: "Grand livre",
  Cashbook: "Livre de caisse",
  Reports: "Rapports",
  "Expense report": "Rapport des dépenses",
  "Sales report": "Rapport des ventes",
  "P&L": "Résultat",
  "Profit and loss": "Compte de résultat",
  "AI Analytics": "Analyses IA",
  Payroll: "Paie",
  Employees: "Employés",
  "Add employee": "Ajouter un employé",
  "Edit employee": "Modifier l'employé",
  Leave: "Congés",
  Attendance: "Présences",
  Payslips: "Fiches de paie",
  Policies: "Règles",
  "Payroll policies": "Règles de paie",
  "Sign in": "Connexion",
  "Email address": "Adresse e-mail",
  Password: "Mot de passe",
  "Remember me": "Se souvenir de moi",
  Login: "Connexion",
  "Demo credentials": "Identifiants de démo",
  "Use the demo administrator account to explore the prototype.":
    "Utilisez le compte administrateur de démo pour explorer le prototype.",
  "What you can run from here": "Ce que vous pouvez gérer ici",
  "The floor, the books and the wage bill in one place.":
    "La salle, les comptes et la masse salariale au même endroit.",
  "Built for a Mauritian restaurant: tickets in rupees, Workers' Rights Act leave, and the figures an owner checks before service.":
    "Conçu pour un restaurant mauricien : additions en roupies, congés selon le Workers' Rights Act, et les chiffres que le propriétaire vérifie avant le service.",
  "Demo authentication only. No production backend.":
    "Authentification de démo seulement. Pas de serveur de production.",
  "The floor": "La salle",
  "Zones, tables, orders, recipes and the storeroom.":
    "Zones, tables, commandes, recettes et réserve.",
  "The books": "Les comptes",
  "Purchases, expenses, assets, the journal and the cashbook.":
    "Achats, dépenses, immobilisations, journal et livre de caisse.",
  "The owner view": "La vue du propriétaire",
  "Sales, what is left after costs, and cash and bank.":
    "Ventes, ce qui reste après les coûts, caisse et banque.",
  "Staff, leave, attendance and payslips with CSG, NSF, PRGF and PAYE.":
    "Équipe, congés, présences et fiches de paie avec CSG, NSF, PRGF et PAYE.",
  "A week-ahead call, the dishes to push, and what runs out first.":
    "Une prévision à sept jours, les plats à pousser, et ce qui manque en premier.",
  Sales: "Ventes",
  "Left after costs": "Reste après les coûts",
  "Cash and bank": "Caisse et banque",
  Team: "Équipe",
  "No tickets this month, so this is the year": "Aucun ticket ce mois-ci, donc voici l'année",
  "Tickets that were not cancelled": "Tickets non annulés",
  "Sales, less food, running costs and depreciation":
    "Ventes, moins la nourriture, les frais courants et l'amortissement",
  "What the cashbook currently holds": "Ce que le livre de caisse contient",
  "Needs a decision": "À décider",
  "The floor, the storeroom and payroll are clear for now.":
    "La salle, la réserve et la paie sont calmes pour l'instant.",
  "See orders": "Voir les commandes",
  "See inventory": "Voir le stock",
  "See leave": "Voir les congés",
  "Open payslips": "Ouvrir les fiches",
  "Restock before service runs short": "Réapprovisionnez avant que le service manque.",
  "Approve or decline before the roster is set": "Approuvez ou refusez avant de fixer le planning.",
  "open or being prepared": "ouvertes ou en préparation",
  "Profit and loss": "Compte de résultat",
  Company: "Société",
  "Trading name": "Nom commercial",
  "Legal name": "Raison sociale",
  BRN: "BRN",
  "VAT number": "Numéro de TVA",
  TAN: "TAN",
  Phone: "Téléphone",
  Email: "E-mail",
  Website: "Site web",
  City: "Ville",
  Address: "Adresse",
  "Upload logo": "Téléverser le logo",
  "Remove logo": "Retirer le logo",
  "Save company": "Enregistrer la société",
  "Signed-in user": "Utilisateur connecté",
  Name: "Nom",
  Role: "Rôle",
  "Demo authentication": "Authentification de démo",
  "This login is local only. It is not JWT-based and should not be used in production.":
    "Cette connexion est locale. Elle n'utilise pas de JWT et ne doit pas servir en production.",
  "Demo data": "Données de démo",
  "Reset demo data": "Réinitialiser les données",
  "Reset demo data?": "Réinitialiser les données ?",
  "Reset data": "Réinitialiser",
  "Company details used on the sidebar and on reports. Everything stays in this browser.":
    "Coordonnées de la société, utilisées dans le menu et sur les rapports. Tout reste dans ce navigateur.",
  "This replaces all local zones, tables, menu, inventory and company details with the original B42 Bistro seed data.":
    "Cela remplace les zones, tables, le menu, le stock et la société par les données d'origine de B42 Bistro.",
  Included: "Inclus",
  "Free · runs on your own books": "Gratuit · calculé sur vos propres livres",
  "Week ahead": "Semaine à venir",
  "Next service": "Prochain service",
  Storeroom: "Réserve",
  "Thin read": "Lecture mince",
  "Fair read": "Lecture correcte",
  "Strong read": "Lecture solide",
  "Worth paying for": "À activer",
  "One restaurant · yearly is ten months · lifetime does not renew":
    "Un restaurant · l'année vaut dix mois · la licence à vie ne se renouvelle pas",
  Monthly: "Mensuel",
  Yearly: "Annuel",
  Lifetime: "À vie",
  "Three readings from the tickets already in this browser. Three stronger models you can switch on.":
    "Trois lectures à partir des tickets déjà dans ce navigateur. Trois modèles plus forts que vous pouvez activer.",
  "Ask the books": "Interroger les livres",
  "Price the menu": "Tarifer le menu",
  "Guest ear": "Oreille client",
  "Prepared for": "Préparé pour",
  Period: "Période",
  From: "Du",
  To: "Au",
  "Generate PDF": "Générer le PDF",
  "Business owner": "Propriétaire",
  "Summary view": "Vue résumée",
  Accountant: "Comptable",
  "Full working papers": "Dossier de travail complet",
  "This month": "Ce mois",
  "Last month": "Mois dernier",
  "This quarter": "Ce trimestre",
  "Last quarter": "Trimestre dernier",
  "This year": "Cette année",
  "Last year": "L'année dernière",
  "Custom dates": "Dates libres",
  "Add zone": "Ajouter une zone",
  "Add table": "Ajouter une table",
  "Add category": "Ajouter une catégorie",
  "Add unit": "Ajouter une unité",
  "Add ingredient": "Ajouter un ingrédient",
  "Add order": "Ajouter une commande",
  "Track ingredient": "Suivre un ingrédient",
  "Record purchase": "Enregistrer un achat",
  "Record expense": "Enregistrer une dépense",
  "Register asset": "Enregistrer une immobilisation",
  "Add account": "Ajouter un compte",
  "Add journal entry": "Ajouter une écriture",
  "Request leave": "Demander un congé",
  "Add attendance": "Ajouter une présence",
  "Generate all": "Tout générer",
  "Run balance check": "Lancer le contrôle",
  "On payroll": "En paie",
  Inactive: "Inactifs",
  "Monthly basic bill": "Masse salariale de base",
  Pending: "En attente",
  Approved: "Approuvés",
  "All requests": "Toutes les demandes",
  "Personal details, job type, start date and pay-role settings for Mauritian CSG, NSF, PRGF and PAYE.":
    "Identité, type de poste, date d'entrée et paramètres de paie pour la CSG, la NSF, le PRGF et le PAYE à Maurice.",
  "No employees": "Aucun employé",
  "Add the first team member to start leave, attendance and payslips.":
    "Ajoutez le premier membre de l'équipe pour ouvrir les congés, les présences et les fiches de paie.",
  "Delete employee?": "Supprimer l'employé ?",
  "Employees with payslips cannot be deleted. Deactivate the record instead.":
    "Un employé qui a des fiches de paie ne peut pas être supprimé. Désactivez la fiche.",
  "Personal, job and pay details used for CSG, NSF, PRGF, PAYE and leave.":
    "Identité, poste et paie utilisés pour la CSG, la NSF, le PRGF, le PAYE et les congés.",
  "Annual, sick, urgent, special, vacation, maternity and paternity leave. Entitlements follow the Workers' Rights Act 2019 and house policy.":
    "Congés annuels, maladie, urgents, spéciaux, de vacances, de maternité et de paternité. Les droits suivent le Workers' Rights Act 2019 et la politique de la maison.",
  "No leave recorded": "Aucun congé",
  "Request annual, sick or urgent leave for an employee.":
    "Demandez un congé annuel, maladie ou urgent pour un employé.",
  "Delete leave request?": "Supprimer la demande ?",
  "This removes the request from the leave register.": "Cela retire la demande du registre des congés.",
  "Generate monthly payslips for one employee or the whole team. CSG, NSF, PAYE, HRDC and PRGF follow MRA rates stored in Policies.":
    "Générez les fiches du mois pour un employé ou toute l'équipe. CSG, NSF, PAYE, HRDC et PRGF suivent les taux MRA des règles.",
  "Employer cost (approx.)": "Coût employeur (approx.)",
  "Slips this period": "Fiches de la période",
  "No payslips": "Aucune fiche",
  "Choose a month and generate slips for one employee or everyone.":
    "Choisissez un mois et générez les fiches pour un employé ou pour tous.",
  "Delete payslip?": "Supprimer la fiche ?",
  "You can generate it again for the same month.": "Vous pouvez la régénérer pour le même mois.",
  "Daily clocking, absences, overtime and public-holiday hours. Payslips use this register for the month.":
    "Pointage, absences, heures supplémentaires et jours fériés. Les fiches de paie utilisent ce registre.",
  "Records this month": "Lignes ce mois",
  "Present marks": "Présences",
  "Overtime hours": "Heures supplémentaires",
  "No attendance this month": "Aucune présence ce mois",
  "Add a day, or pick an employee and mark remaining working days present.":
    "Ajoutez un jour, ou choisissez un employé et marquez les jours restants comme présents.",
  "Delete attendance?": "Supprimer la présence ?",
  "This day will no longer count on the next payslip run.":
    "Ce jour ne comptera plus au prochain calcul de paie.",
  "Leave entitlements, contribution rates and public holidays used by payslips. Defaults match MRA CSG/NSF/HRDC/PRGF guidance and the Workers' Rights Act 2019.":
    "Droits aux congés, taux de cotisation et jours fériés utilisés par les fiches. Les valeurs suivent la MRA et le Workers' Rights Act 2019.",
  "Sales less purchases, operating expenses and depreciation. Switch period or audience and the statement recalculates.":
    "Ventes moins achats, frais d'exploitation et amortissement. Changez la période ou le lecteur et l'état se recalcule.",
  "Choose who the report is for and a period. Cancelled tickets are excluded.":
    "Choisissez le lecteur et la période. Les tickets annulés sont exclus.",
  "Choose who the report is for and a period. Figures update immediately from live books.":
    "Choisissez le lecteur et la période. Les chiffres suivent les livres en direct.",
  "The register of vehicles, kitchen plant, furniture and land. Book value is cost less accumulated depreciation, which is what the business is worth in the books.":
    "Registre des véhicules, du matériel de cuisine, du mobilier et du terrain. La valeur nette est le coût moins l'amortissement.",
  "Asset cost": "Coût des biens",
  "Written down": "Amorti",
  "Fixed assets book value": "Valeur nette des immobilisations",
  "Business value (books)": "Valeur de l'affaire (livres)",
  "No assets registered": "Aucune immobilisation",
  "Add vehicles, ovens, furniture or land so the books show the real value of the business.":
    "Ajoutez véhicules, fours, mobilier ou terrain pour que les livres montrent la valeur de l'affaire.",
  "Delete asset?": "Supprimer l'immobilisation ?",
  "Assets with depreciation posted cannot be deleted.":
    "Une immobilisation déjà amortie ne peut pas être supprimée.",
  "Every double-entry posting. Purchases, expenses and inventory posts are created automatically. Use a manual entry for adjustments.":
    "Toutes les écritures en partie double. Achats, dépenses et stock sont passés automatiquement. Une écriture manuelle sert aux ajustements.",
  "Journal entries": "Écritures",
  "Manual entries": "Écritures manuelles",
  "No journal entries": "Aucune écriture",
  "Post a balanced debit and credit.": "Passez un débit et un crédit qui s'équilibrent.",
  "Delete journal entry?": "Supprimer l'écriture ?",
  "Only manual entries can be removed.": "Seules les écritures manuelles peuvent être retirées.",
  "Record operating costs. They post to the journal as a debit to the expense account and a credit to cash, bank or payables.":
    "Enregistrez les frais d'exploitation. Ils passent au journal : débit du compte de charge, crédit de la caisse, de la banque ou des fournisseurs.",
  "Expense bills": "Factures de frais",
  "Recorded spend": "Dépenses enregistrées",
  "No expenses yet": "Aucune dépense",
  "Record rent, electricity, wages and other operating costs.":
    "Enregistrez le loyer, l'électricité, les salaires et les autres frais.",
  "Delete expense?": "Supprimer la dépense ?",
  "This also removes the related journal entry.": "Cela retire aussi l'écriture liée.",
  "Receipts and payments on cash and bank accounts. Closing balance is what should be in the till or at the bank.":
    "Encaissements et paiements de la caisse et de la banque. Le solde de clôture est ce qui devrait être en caisse ou à la banque.",
  Receipts: "Encaissements",
  Payments: "Paiements",
  Closing: "Solde",
  "No cash accounts": "Aucun compte de caisse",
  "Mark an asset account as cashbook in the chart of accounts.":
    "Marquez un compte d'actif comme livre de caisse dans le plan comptable.",
  "One account at a time, with a running balance. This is the book the accountant uses to inspect cash, stock, sales and expenses.":
    "Un compte à la fois, avec un solde progressif. C'est le livre que le comptable utilise pour la caisse, le stock, les ventes et les frais.",
  Debits: "Débits",
  Credits: "Crédits",
  "No accounts": "Aucun compte",
  "Add accounts first.": "Ajoutez d'abord des comptes.",
  "No postings": "Aucune écriture",
  "The restaurant ledger. System accounts stay in place so purchases, cash and inventory post correctly.":
    "Le grand livre du restaurant. Les comptes système restent en place pour que les achats, la caisse et le stock passent correctement.",
  Accounts: "Comptes",
  "Trial debit": "Total débit",
  "Trial credit": "Total crédit",
  "Add the accounts the restaurant posts to.": "Ajoutez les comptes sur lesquels le restaurant passe ses écritures.",
  "Delete account?": "Supprimer le compte ?",
  "Accounts with journal activity cannot be deleted.":
    "Un compte qui a des écritures ne peut pas être supprimé.",
  "Record supplier bills. They post to the journal at once. After saving, post each line to inventory when the goods are on the shelf.":
    "Enregistrez les factures fournisseurs. Elles passent au journal tout de suite. Ensuite, passez chaque ligne au stock quand la marchandise est en rayon.",
  "Purchase bills": "Factures d'achat",
  "Waiting on inventory": "En attente de stock",
  "No purchases yet": "Aucun achat",
  "Record a supplier invoice, then post lines to inventory when stock arrives.":
    "Enregistrez une facture fournisseur, puis passez les lignes au stock à l'arrivée.",
  "Delete purchase?": "Supprimer l'achat ?",
  "This also removes the related journal entry. Lines already posted to inventory cannot be deleted.":
    "Cela retire aussi l'écriture liée. Une ligne déjà passée au stock ne peut pas être supprimée.",
  "Run a check to see whether recipes from orders match what has been booked out of stock.":
    "Vérifiez si les recettes des commandes correspondent à ce qui a été sorti du stock.",
  "No balance check yet": "Aucun contrôle pour l'instant",
  "Click Run balance check to compare order recipes with inventory movements and see if anything is short or not booked out.":
    "Lancez le contrôle pour comparer les recettes des commandes aux mouvements de stock.",
  Tallying: "Ça correspond",
  "Not booked out": "Pas sorti du stock",
  "Extra stock out": "Sortie en trop",
  "Cannot cover orders": "Ne couvre pas les commandes",
  "Nothing to compare": "Rien à comparer",
  "There are no non-cancelled orders using recipe ingredients yet.":
    "Il n'y a pas encore de commande active qui utilise des ingrédients de recette.",
  "Create table orders using restaurant zones, tables, menu categories and menu items.":
    "Créez des commandes de table à partir des zones, des tables, des catégories et des articles.",
  "No orders found": "Aucune commande",
  "Create an order by choosing a zone, table and menu items.":
    "Créez une commande en choisissant une zone, une table et des articles.",
  "Delete order?": "Supprimer la commande ?",
  "Track ingredient stock, costs and movement. Stock is not deducted when recipes change.":
    "Suivez le stock, le coût et les mouvements. Changer une recette ne retire pas le stock.",
  "Ingredients tracked": "Ingrédients suivis",
  "Low stock items": "Stock bas",
  "Out of stock": "Rupture",
  "Total inventory value": "Valeur du stock",
  "No inventory records": "Aucun stock",
  "Select an existing ingredient and set opening stock, minimum level and unit cost.":
    "Choisissez un ingrédient et indiquez le stock d'ouverture, le minimum et le coût.",
  "Remove inventory record?": "Retirer le suivi de stock ?",
  "This removes stock tracking for the ingredient. The ingredient itself is not deleted.":
    "Cela retire le suivi. L'ingrédient lui-même reste.",
  "Master data for recipes. Stock quantities are managed in Inventory, not here.":
    "Fiches pour les recettes. Les quantités en stock se gèrent dans Stock, pas ici.",
  "No ingredients found": "Aucun ingrédient",
  "Add reusable ingredients such as chicken, cheese or flour.":
    "Ajoutez des ingrédients réutilisables, comme le poulet, le fromage ou la farine.",
  "Delete ingredient?": "Supprimer l'ingrédient ?",
  "Ingredients linked to menu items or inventory records cannot be deleted.":
    "Un ingrédient lié à un plat ou à un stock ne peut pas être supprimé.",
  "Units of measurement": "Unités de mesure",
  "Master units used by ingredients and inventory. Units in use cannot be deleted.":
    "Unités utilisées par les ingrédients et le stock. Une unité en service ne peut pas être supprimée.",
  "No units found": "Aucune unité",
  "Add units such as kilogram, litre or piece before creating ingredients.":
    "Ajoutez des unités, comme le kilogramme, le litre ou la pièce, avant les ingrédients.",
  "Delete unit?": "Supprimer l'unité ?",
  "Units that are assigned to ingredients cannot be deleted.":
    "Une unité assignée à un ingrédient ne peut pas être supprimée.",
  "Organise the menu. Categories with linked items cannot be deleted.":
    "Organisez le menu. Une catégorie qui a des articles ne peut pas être supprimée.",
  "No categories found": "Aucune catégorie",
  "Delete category?": "Supprimer la catégorie ?",
  "Create dining areas such as Indoor, Outdoor, VIP and Rooftop.":
    "Créez des salles, comme l'intérieur, la terrasse, le VIP ou le toit.",
  "No zones found": "Aucune zone",
  "Delete zone?": "Supprimer la zone ?",
  "Zones with assigned tables cannot be deleted.":
    "Une zone qui a des tables ne peut pas être supprimée.",
  "Place tables inside zones and set how many guests each one seats.":
    "Placez les tables dans les zones et indiquez le nombre de couverts.",
  "No tables found": "Aucune table",
  "Delete table?": "Supprimer la table ?",
  "Build the menu with a category, a price in rupees and the ingredients it uses.":
    "Composez le menu avec une catégorie, un prix en roupies et les ingrédients.",
  "No menu items found": "Aucun article",
  "Delete menu item?": "Supprimer l'article ?",
  "Menu items": "Articles du menu",
  "Add menu item": "Ajouter un article",
  "Sellable dishes with recipes, category and Mauritian Rupee pricing.":
    "Plats à vendre, avec recette, catégorie et prix en roupies.",
  "No menu items found": "Aucun article",
  "Create dishes with a category, selling price and ingredient recipe.":
    "Créez des plats avec une catégorie, un prix et une recette.",
  "Create categories such as Starters, Burgers or Desserts.":
    "Créez des catégories, comme les entrées, les burgers ou les desserts.",
  "Categories that still contain menu items cannot be deleted.":
    "Une catégorie qui contient encore des articles ne peut pas être supprimée.",
  "Restaurant tables must belong to a zone. Duplicate names are not allowed in the same zone.":
    "Chaque table appartient à une zone. Le même nom n'est pas permis deux fois dans une zone.",
  "Add tables to a zone to start building the floor plan.":
    "Ajoutez des tables à une zone pour commencer le plan de salle.",
  "Physical restaurant areas used to organise tables.":
    "Les espaces du restaurant qui servent à ranger les tables.",
  "Create your first dining zone to start assigning tables.":
    "Créez la première zone pour commencer à y mettre des tables.",
  "This will permanently remove the zone from the back office. Zones with assigned tables cannot be deleted.":
    "Cela retire la zone du back-office. Une zone qui a des tables ne peut pas être supprimée.",
};

const mfe: Record<string, string> = {
  Language: "Lang",
  "Restaurant back office": "Biwo restoran",
  "Back office": "Biwo",
  Administrator: "Administrater",
  Account: "Kont",
  Profile: "Profil",
  Settings: "Paramet",
  Logout: "Dekonekte",
  Cancel: "Anile",
  Delete: "Efase",
  Dashboard: "Tablo",
  "Restaurant Management": "Zesyon restoran",
  Restaurant: "Restoran",
  Zones: "Zon",
  Tables: "Tab",
  Categories: "Kategori",
  Units: "Inite",
  Ingredients: "Engredian",
  "Menu Items": "Plad menu",
  Orders: "Komann",
  Inventory: "Stok",
  "Balance Inventory": "Kontrol stok",
  "Balance inventory": "Kontrol stok",
  Accounting: "Kontabilite",
  Purchases: "Asa",
  Expenses: "Depans",
  Assets: "Byen",
  "Chart of Accounts": "Plan kont",
  "Journal Book": "Zournal",
  Ledger: "Gran liv",
  Cashbook: "Kaye lakès",
  Reports: "Raport",
  "Expense report": "Raport depans",
  "Sales report": "Raport lavant",
  "P&L": "Profil ek pert",
  "Profit and loss": "Profil ek pert",
  "AI Analytics": "Analiz IA",
  Payroll: "Lapey",
  Employees: "Anplwaye",
  "Add employee": "Azout anplwaye",
  "Edit employee": "Sanz anplwaye",
  Leave: "Konze",
  Attendance: "Prezans",
  Payslips: "Bilten lapey",
  Policies: "Regleman",
  "Payroll policies": "Regleman lapey",
  "Sign in": "Konekte",
  "Email address": "Ladres imel",
  Password: "Modpas",
  "Remember me": "Rapel mwa",
  Login: "Konekte",
  "Demo credentials": "Koneksyon demo",
  "Use the demo administrator account to explore the prototype.":
    "Servi kont administrater demo pou get prototip la.",
  "What you can run from here": "Ki to kapav fer isi",
  "The floor, the books and the wage bill in one place.":
    "Lasal, liv ek lapey dan enn sel plas.",
  "Built for a Mauritian restaurant: tickets in rupees, Workers' Rights Act leave, and the figures an owner checks before service.":
    "Fer pou enn restoran morisien : tiké an roupi, konze dapre Workers' Rights Act, ek sif ki patron get avan servis.",
  "Demo authentication only. No production backend.":
    "Koneksyon demo zis. Pena enn servè prodiksyon.",
  "The floor": "Lasal",
  "Zones, tables, orders, recipes and the storeroom.": "Zon, tab, komann, resèt ek depo.",
  "The books": "Bann liv",
  "Purchases, expenses, assets, the journal and the cashbook.":
    "Asa, depans, byen, zournal ek kaye lakès.",
  "The owner view": "Vizion patron",
  "Sales, what is left after costs, and cash and bank.":
    "Lavant, seki reste apre depans, kas ek labank.",
  "Staff, leave, attendance and payslips with CSG, NSF, PRGF and PAYE.":
    "Ekip, konze, prezans ek bilten lapey avek CSG, NSF, PRGF ek PAYE.",
  "A week-ahead call, the dishes to push, and what runs out first.":
    "Enn apel pou lasemenn, ki plad pou pous, ek ki pu fini avan.",
  Sales: "Lavant",
  "Left after costs": "Reste apre depans",
  "Cash and bank": "Kas ek labank",
  Team: "Ekip",
  "No tickets this month, so this is the year": "Pena tiké sa mwa la, alor se lane la.",
  "Tickets that were not cancelled": "Tike ki pa'nn anile",
  "Sales, less food, running costs and depreciation":
    "Lavant, mwens manze, depans toulezour ek depreseyasyon",
  "What the cashbook currently holds": "Seki ena dan kaye lakès asterla",
  "Needs a decision": "Bizwin enn desizyon",
  "The floor, the storeroom and payroll are clear for now.":
    "Lasal, depo ek lapey trankil pou lerla.",
  "See orders": "Get komann",
  "See inventory": "Get stok",
  "See leave": "Get konze",
  "Open payslips": "Ouv bilten",
  "Restock before service runs short": "Ranpli avan servis mank.",
  "Approve or decline before the roster is set": "Asepte ou refize avan to fik roster la.",
  "open or being prepared": "ouver ou pe prepare",
  "Profit and loss": "Profil ek pert",
  Company: "Konpani",
  "Trading name": "Non komers",
  "Legal name": "Non legal",
  BRN: "BRN",
  "VAT number": "Nimerro TVA",
  TAN: "TAN",
  Phone: "Telefon",
  Email: "Imel",
  Website: "Sit web",
  City: "Vil",
  Address: "Ladres",
  "Upload logo": "Met logo",
  "Remove logo": "Tiy logo",
  "Save company": "Sov konpani",
  "Signed-in user": "Dimoun konekte",
  Name: "Non",
  Role: "Rol",
  "Demo authentication": "Koneksyon demo",
  "This login is local only. It is not JWT-based and should not be used in production.":
    "Koneksyon la lokal zis. Li pa JWT ek li pa pou prodiksyon.",
  "Demo data": "Donne demo",
  "Reset demo data": "Remet donne demo",
  "Reset demo data?": "Remet donne demo ?",
  "Reset data": "Remet",
  "Company details used on the sidebar and on reports. Everything stays in this browser.":
    "Detay konpani ki parèt dan menu ek lor raport. Tou reste dan sa navigater la.",
  "This replaces all local zones, tables, menu, inventory and company details with the original B42 Bistro seed data.":
    "Sa ranplas zon, tab, menu, stok ek konpani ar donne orizinal B42 Bistro.",
  Included: "Inklu",
  "Free · runs on your own books": "Gratis · li kalkil lor ou prop liv",
  "Week ahead": "Lasemenn ki pe vini",
  "Next service": "Prosin servis",
  Storeroom: "Depo",
  "Thin read": "Lekti fèb",
  "Fair read": "Lekti korekt",
  "Strong read": "Lekti solid",
  "Worth paying for": "Pou pey",
  "One restaurant · yearly is ten months · lifetime does not renew":
    "Enn restoran · lane la valer dis mwa · lavi pa renouvle",
  Monthly: "Par mwa",
  Yearly: "Par lane",
  Lifetime: "Pou lavi",
  "Three readings from the tickets already in this browser. Three stronger models you can switch on.":
    "Trwa lektir depi tiké ki deza dan navigater la. Trwa model pli for ki to kapav alim.",
  "Ask the books": "Demann liv la",
  "Price the menu": "Met pri menu",
  "Guest ear": "Zorey kliyan",
  "Prepared for": "Prepare pou",
  Period: "Periyod",
  From: "Depi",
  To: "Ziska",
  "Generate PDF": "Fer PDF",
  "Business owner": "Patron",
  "Summary view": "Rezime",
  Accountant: "Kontab",
  "Full working papers": "Dosie travay konple",
  "This month": "Sa mwa la",
  "Last month": "Mwa dernye",
  "This quarter": "Sa trimest la",
  "Last quarter": "Trimest dernye",
  "This year": "Sa lane la",
  "Last year": "Lane dernye",
  "Custom dates": "Dat ou swazir",
  "Add zone": "Azout zon",
  "Add table": "Azout tab",
  "Add category": "Azout kategori",
  "Add unit": "Azout inite",
  "Add ingredient": "Azout engredian",
  "Add order": "Azout komann",
  "Track ingredient": "Swiv engredian",
  "Record purchase": "Not enn asa",
  "Record expense": "Not enn depans",
  "Register asset": "Not enn byen",
  "Add account": "Azout kont",
  "Add journal entry": "Azout enn ekrir",
  "Request leave": "Demann konze",
  "Add attendance": "Azout prezans",
  "Generate all": "Fer tou",
  "Run balance check": "Lans kontrol",
  "On payroll": "Lor lapey",
  Inactive: "Inaktif",
  "Monthly basic bill": "Saler baz par mwa",
  Pending: "Pe atann",
  Approved: "Asepte",
  "All requests": "Tou demann",
  "Personal details, job type, start date and pay-role settings for Mauritian CSG, NSF, PRGF and PAYE.":
    "Idantite, tip travay, dat koumansman ek paramet lapey pou CSG, NSF, PRGF ek PAYE Moris.",
  "No employees": "Pena anplwaye",
  "Add the first team member to start leave, attendance and payslips.":
    "Azout premie dimoun dan lekip pou koumans konze, prezans ek bilten.",
  "Delete employee?": "Efase anplwaye ?",
  "Employees with payslips cannot be deleted. Deactivate the record instead.":
    "Enn anplwaye ki ena bilten pa kapav efase. Dezaktiv fich la.",
  "Personal, job and pay details used for CSG, NSF, PRGF, PAYE and leave.":
    "Idantite, travay ek lapey pou CSG, NSF, PRGF, PAYE ek konze.",
  "Annual, sick, urgent, special, vacation, maternity and paternity leave. Entitlements follow the Workers' Rights Act 2019 and house policy.":
    "Konze aniel, malad, irzan, spesyal, vakans, matènite ek patènite. Drwa la swiv Workers' Rights Act 2019 ek regleman lakaz.",
  "No leave recorded": "Pena konze",
  "Request annual, sick or urgent leave for an employee.":
    "Demann konze aniel, malad ou irzan pou enn anplwaye.",
  "Delete leave request?": "Efase demann konze ?",
  "This removes the request from the leave register.": "Sa tir demann la depi rezist konze.",
  "Generate monthly payslips for one employee or the whole team. CSG, NSF, PAYE, HRDC and PRGF follow MRA rates stored in Policies.":
    "Fer bilten dimwa pou enn anplwaye ou pou tou lekip. CSG, NSF, PAYE, HRDC ek PRGF swiv to MRA dan regleman.",
  "Employer cost (approx.)": "Kou patron (apeprè)",
  "Slips this period": "Bilten sa periyod",
  "No payslips": "Pena bilten",
  "Choose a month and generate slips for one employee or everyone.":
    "Swazir enn mwa ek fer bilten pou enn dimoun ou pou tou dimoun.",
  "Delete payslip?": "Efase bilten ?",
  "You can generate it again for the same month.": "To kapav refer li pou mem mwa.",
  "Daily clocking, absences, overtime and public-holiday hours. Payslips use this register for the month.":
    "Pwentaz, absans, overlime ek zer zour ferie. Bilten lapey servi sa rezist la.",
  "Records this month": "Liy sa mwa",
  "Present marks": "Prezans",
  "Overtime hours": "Zer overlime",
  "No attendance this month": "Pena prezans sa mwa",
  "Add a day, or pick an employee and mark remaining working days present.":
    "Azout enn zour, ou swazir enn anplwaye ek mark zour ki reste kouma prezan.",
  "Delete attendance?": "Efase prezans ?",
  "This day will no longer count on the next payslip run.":
    "Sa zour la pa pu kont ankor kan to refer bilten.",
  "Leave entitlements, contribution rates and public holidays used by payslips. Defaults match MRA CSG/NSF/HRDC/PRGF guidance and the Workers' Rights Act 2019.":
    "Drwa konze, to kotizasyon ek zour ferie ki bilten servi. Valer la swiv MRA ek Workers' Rights Act 2019.",
  "Sales less purchases, operating expenses and depreciation. Switch period or audience and the statement recalculates.":
    "Lavant mwens asa, depans ek depreseyasyon. Sanz periyod ou lekter ek eta la rekalkil.",
  "Choose who the report is for and a period. Cancelled tickets are excluded.":
    "Swazir pou kisannla ek ki periyod. Tiké anile pa kont.",
  "Choose who the report is for and a period. Figures update immediately from live books.":
    "Swazir pou kisannla ek ki periyod. Sif la swiv liv la touswit.",
  "The register of vehicles, kitchen plant, furniture and land. Book value is cost less accumulated depreciation, which is what the business is worth in the books.":
    "Rezist loto, masinn lakizin, meb ek later. Valer net se kou mwens depreseyasyon.",
  "Asset cost": "Kou bann byen",
  "Written down": "Depresye",
  "Fixed assets book value": "Valer net bann byen",
  "Business value (books)": "Valer biznis (liv)",
  "No assets registered": "Pena byen",
  "Add vehicles, ovens, furniture or land so the books show the real value of the business.":
    "Azout loto, four, meb ou later pou liv la mont valer vre biznis la.",
  "Delete asset?": "Efase byen ?",
  "Assets with depreciation posted cannot be deleted.": "Enn byen ki'nn deza depresye pa kapav efase.",
  "Every double-entry posting. Purchases, expenses and inventory posts are created automatically. Use a manual entry for adjustments.":
    "Tou ekrir an doub. Asa, depans ek stok pas toutsel. Ekrir alamen pou azisteman.",
  "Journal entries": "Ekrir",
  "Manual entries": "Ekrir alamen",
  "No journal entries": "Pena ekrir",
  "Post a balanced debit and credit.": "Pas enn debi ek enn kredi ki egal.",
  "Delete journal entry?": "Efase ekrir ?",
  "Only manual entries can be removed.": "Zis ekrir alamen kapav tire.",
  "Record operating costs. They post to the journal as a debit to the expense account and a credit to cash, bank or payables.":
    "Not depans operasyon. Li pas dan zournal : debi kont depans, kredi kas, labank ou fourniser.",
  "Expense bills": "Faktir depans",
  "Recorded spend": "Depans note",
  "No expenses yet": "Pena depans",
  "Record rent, electricity, wages and other operating costs.":
    "Not lwaye, kouran, saler ek lezot depans.",
  "Delete expense?": "Efase depans ?",
  "This also removes the related journal entry.": "Sa tir osi ekrir ki kole ar li.",
  "Receipts and payments on cash and bank accounts. Closing balance is what should be in the till or at the bank.":
    "Larzan rantre ek sorti lor kas ek labank. Sold fermi se seki bizwin ena dan kes ou labank.",
  Receipts: "Larzan rantre",
  Payments: "Peyman",
  Closing: "Sold",
  "No cash accounts": "Pena kont kas",
  "Mark an asset account as cashbook in the chart of accounts.":
    "Mark enn kont byen kouma kaye lakès dan plan kont.",
  "One account at a time, with a running balance. This is the book the accountant uses to inspect cash, stock, sales and expenses.":
    "Enn kont alafoa, avek sold ki mars. Se liv ki kontab get pou kas, stok, lavant ek depans.",
  Debits: "Debi",
  Credits: "Kredi",
  "No accounts": "Pena kont",
  "Add accounts first.": "Azout kont avan.",
  "No postings": "Pena ekrir",
  "The restaurant ledger. System accounts stay in place so purchases, cash and inventory post correctly.":
    "Gran liv restoran. Kont sistem rest anplas pou asa, kas ek stok pas korek.",
  Accounts: "Kont",
  "Trial debit": "Total debi",
  "Trial credit": "Total kredi",
  "Add the accounts the restaurant posts to.": "Azout kont ki restoran servi pou so ekrir.",
  "Delete account?": "Efase kont ?",
  "Accounts with journal activity cannot be deleted.": "Enn kont ki ena ekrir pa kapav efase.",
  "Record supplier bills. They post to the journal at once. After saving, post each line to inventory when the goods are on the shelf.":
    "Not faktir fourniser. Li pas dan zournal touswit. Apre, pas sak liny dan stok kan marsandiz la lor letaz.",
  "Purchase bills": "Faktir asa",
  "Waiting on inventory": "Pe atann stok",
  "No purchases yet": "Pena asa",
  "Record a supplier invoice, then post lines to inventory when stock arrives.":
    "Not enn faktir fourniser, apre pas liny dan stok kan li rive.",
  "Delete purchase?": "Efase asa ?",
  "This also removes the related journal entry. Lines already posted to inventory cannot be deleted.":
    "Sa tir osi ekrir la. Enn liny ki'nn deza pas dan stok pa kapav efase.",
  "Run a check to see whether recipes from orders match what has been booked out of stock.":
    "Get si resèt komann koresponn ar seki'nn sorti depi stok.",
  "No balance check yet": "Pena kontrol ankor",
  "Click Run balance check to compare order recipes with inventory movements and see if anything is short or not booked out.":
    "Lans kontrol pou konpar resèt komann ar mouvman stok.",
  Tallying: "Li koresponn",
  "Not booked out": "Pa'nn sorti",
  "Extra stock out": "Sorti anplis",
  "Cannot cover orders": "Pa kapav kouver komann",
  "Nothing to compare": "Nanye pou konpar",
  "There are no non-cancelled orders using recipe ingredients yet.":
    "Pena ankor komann aktif ki servi engredian resèt.",
  "Create table orders using restaurant zones, tables, menu categories and menu items.":
    "Fer komann tab depi zon, tab, kategori ek plad.",
  "No orders found": "Pena komann",
  "Create an order by choosing a zone, table and menu items.":
    "Fer enn komann an swazir zon, tab ek plad.",
  "Delete order?": "Efase komann ?",
  "Track ingredient stock, costs and movement. Stock is not deducted when recipes change.":
    "Swiv stok, kou ek mouvman. Sanz enn resèt pa tir stok.",
  "Ingredients tracked": "Engredian swivi",
  "Low stock items": "Stok ba",
  "Out of stock": "Fini",
  "Total inventory value": "Valer stok",
  "No inventory records": "Pena stok",
  "Select an existing ingredient and set opening stock, minimum level and unit cost.":
    "Swazir enn engredian ek met stok ouvertir, minimem ek kou.",
  "Remove inventory record?": "Tir swivi stok ?",
  "This removes stock tracking for the ingredient. The ingredient itself is not deleted.":
    "Sa tir swivi la. Engredian la mem rest.",
  "Master data for recipes. Stock quantities are managed in Inventory, not here.":
    "Fis pou resèt. Kantite stok zere dan Stok, pa isi.",
  "No ingredients found": "Pena engredian",
  "Add reusable ingredients such as chicken, cheese or flour.":
    "Azout engredian ki reservi, kouma poul, fromaz ou lafarinn.",
  "Delete ingredient?": "Efase engredian ?",
  "Ingredients linked to menu items or inventory records cannot be deleted.":
    "Enn engredian ki kole ar enn plad ou ar stok pa kapav efase.",
  "Units of measurement": "Inite mezir",
  "Master units used by ingredients and inventory. Units in use cannot be deleted.":
    "Inite ki engredian ek stok servi. Enn inite an servis pa kapav efase.",
  "No units found": "Pena inite",
  "Add units such as kilogram, litre or piece before creating ingredients.":
    "Azout inite, kouma kilo, lit ou morso, avan engredian.",
  "Delete unit?": "Efase inite ?",
  "Units that are assigned to ingredients cannot be deleted.":
    "Enn inite ki'nn done enn engredian pa kapav efase.",
  "Organise the menu. Categories with linked items cannot be deleted.":
    "Organiz menu. Enn kategori ki ena plad pa kapav efase.",
  "No categories found": "Pena kategori",
  "Delete category?": "Efase kategori ?",
  "Create dining areas such as Indoor, Outdoor, VIP and Rooftop.":
    "Fer bann lasal, kouma andan, deor, VIP ou toit.",
  "No zones found": "Pena zon",
  "Delete zone?": "Efase zon ?",
  "Zones with assigned tables cannot be deleted.": "Enn zon ki ena tab pa kapav efase.",
  "Place tables inside zones and set how many guests each one seats.":
    "Met tab dan zon ek dir konbyen dimoun sak tab pran.",
  "No tables found": "Pena tab",
  "Delete table?": "Efase tab ?",
  "Build the menu with a category, a price in rupees and the ingredients it uses.":
    "Fer menu avek enn kategori, enn pri an roupi ek engredian ki li servi.",
  "No menu items found": "Pena plad",
  "Delete menu item?": "Efase plad ?",
  "Menu items": "Plad menu",
  "Add menu item": "Azout plad",
  "Sellable dishes with recipes, category and Mauritian Rupee pricing.":
    "Plad pou vann, avek resèt, kategori ek pri an roupi.",
  "No menu items found": "Pena plad",
  "Create dishes with a category, selling price and ingredient recipe.":
    "Fer plad avek enn kategori, enn pri ek enn resèt.",
  "Create categories such as Starters, Burgers or Desserts.":
    "Fer kategori, kouma antre, burger ou deser.",
  "Categories that still contain menu items cannot be deleted.":
    "Enn kategori ki ankor ena plad pa kapav efase.",
  "Restaurant tables must belong to a zone. Duplicate names are not allowed in the same zone.":
    "Sak tab bizwin dan enn zon. Mem non pa gagn drwa de fwa dan enn zon.",
  "Add tables to a zone to start building the floor plan.":
    "Azout tab dan enn zon pou koumans plan lasal.",
  "Physical restaurant areas used to organise tables.":
    "Lespas restoran ki servi pou ranze tab.",
  "Create your first dining zone to start assigning tables.":
    "Fer premie zon pou koumans met tab.",
  "This will permanently remove the zone from the back office. Zones with assigned tables cannot be deleted.":
    "Sa tir zon la depi biwo. Enn zon ki ena tab pa kapav efase.",
};

export const PHRASES: Record<Locale, Record<string, string>> = {
  en: {},
  fr,
  mfe,
};

export function translate(locale: Locale, text: string) {
  if (!text || locale === "en") return text;
  return PHRASES[locale][text] ?? text;
}
