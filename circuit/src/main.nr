use jwt::JWT;

global MAX_PARTIAL_DATA_LENGTH: u32 = 1200; // Increased to handle Google's JWT
global MAX_DOMAIN_LENGTH: u32 = 64;
global MAX_EMAIL_LENGTH: u32 = 128;

fn main(
    partial_data: BoundedVec<u8, MAX_PARTIAL_DATA_LENGTH>,
    partial_hash: [u32; 8],
    full_data_length: u32,
    base64_decode_offset: u32,

    jwt_pubkey_modulus_limbs: pub [Field; 18],
    jwt_pubkey_redc_params_limbs: [Field; 18],
    jwt_signature_limbs: [Field; 18],

    domain: pub BoundedVec<u8, MAX_DOMAIN_LENGTH>, // e.g., "edu"
) {
    // Initialize and verify the JWT signature
    let jwt = JWT::init_with_partial_hash(
        partial_data,
        partial_hash,
        full_data_length,
        base64_decode_offset,
        jwt_pubkey_modulus_limbs,
        jwt_pubkey_redc_params_limbs,
        jwt_signature_limbs,
    );

    jwt.verify();

    // Verify email is verified by Google
    jwt.assert_claim_bool("email_verified".as_bytes(), true);

    // Get the email and verify domain
    let email: BoundedVec<u8, MAX_EMAIL_LENGTH> = jwt.get_claim_string("email".as_bytes());
    
    /** Safety: verify domain bytes below **/
    let domain_start = unsafe { get_domain_start_index_in_email(email) };

    // Verify email format and domain
    assert(email.storage()[domain_start - 1] == 64, "Missing '@'"); // 64 is ASCII for '@'
    for i in 0..MAX_DOMAIN_LENGTH {
        assert(email.storage()[domain_start + i] == domain.storage()[i], "Invalid domain");
    }
}

// Helper: Find index after '@' in email
unconstrained fn get_domain_start_index_in_email(email: BoundedVec<u8, MAX_EMAIL_LENGTH>) -> u32 {
    let mut domain_index = 0;
    for i in 0..MAX_EMAIL_LENGTH {
        if email.storage()[i] == ("@".as_bytes())[0] {
            domain_index = i + 1;
            break;
        }
    }
    domain_index
}






