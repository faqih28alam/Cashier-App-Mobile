export type RootStackParamList = {
  Bootstrap: undefined;
  Login: undefined;
  Home: undefined;

  /**
   * PurchaseList/Keuangan/ReportsHome are rendered as tab roots inside
   * MainTabs (see navigation/MainTabs.tsx) rather than as registered
   * Stack.Screen entries here - navigation.navigate() bubbles up to this
   * root stack for their sub-screens regardless, so they stay listed here
   * purely so those screen files' existing `NativeStackScreenProps<
   * RootStackParamList, 'X'>` prop types keep resolving.
   *
   * KasirSession/Kasir/Payment/ReceiptResult are, for the same typing
   * reason, listed here even though they actually live in the nested
   * KasirStack (navigation/KasirStack.tsx, typed against its own
   * KasirStackParamList) that backs the Kasir tab.
   */
  KasirSession: undefined;
  PurchaseList: undefined;
  Keuangan: undefined;
  ReportsHome: undefined;

  Kasir: {transactionId: number};
  Payment: {transactionId: number};
  ReceiptResult: {transactionId: number};

  PurchaseForm: {purchaseId?: number};

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
