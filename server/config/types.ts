export interface DepositCustomer {
    account_number: string;
    address: string;
    email: string;
    name: string;
    phone_number: string;
    remark: string;
}

export interface WithdrawCustomer {
    account_number: string;
    address: string;
    email: string;
    account_customer_name?: string;  // Make it optional
    name?: string;  // Add 'name' as an optional property
    phone_number: string;
    remark: string;
}


  
export interface Merchant {
    name: string;
}

export interface DepositPaymentRequest {
    amount: string;
    by_method: string;
    callback_url: string;
    currency: string;
    customer: DepositCustomer;
    merchant: Merchant;
    operation_id: string;
    passwork: string; // Note: `passwork`, not `password` in the example
    payment_id: string;
    return_url: string;
    service_id: string;
    signature?: string;
}

export interface WithdrawPaymentRequest {
    amount: string;
    by_method: string;
    callback_url: string;
    currency: string;
    customer: WithdrawCustomer;
    operation_id: string;
    passwork: string; // Note: `passwork`, not `password` in the example
    payment_id: string;
    return_url: string;
    service_id: string;
    signature?: string;
}

export interface StatusPaymentRequest {
    service_id: string;
    passwork: string;
    operation_id: string;
    signature?: string;
}

export interface ApiResponse {
    status: number;
    message: string;
    data?: any;
    error_code?: number; // optional in case of error response
}
  
export interface PaymentStatus {
    name: string;
    description: string;
}