export type RootStackParamList = {
  Bootstrap: undefined;
  Login: undefined;
  Home: undefined;

  KasirSession: undefined;
  Kasir: {transactionId: number};
  Payment: {transactionId: number};
  ReceiptResult: {transactionId: number};

  PurchaseList: undefined;
  PurchaseForm: {purchaseId?: number};

  Keuangan: undefined;

  ReportsHome: undefined;
  SalesReport: undefined;
  ProductReport: undefined;
  StockReport: undefined;
  TransactionReport: undefined;
  FinanceReport: undefined;

  MasterHome: undefined;
  ProductList: undefined;
  ProductForm: {productId?: number};
  CategoryList: undefined;
  SupplierList: undefined;
  UserList: undefined;
  UserForm: {userId?: number};

  Setting: undefined;
  PrinterPairing: undefined;
};
