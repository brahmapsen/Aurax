use zkemail::{
    dkim::RSAPubkey,
    headers::email_address::get_email_address,
    dkim::BoundedVec,
    KEY_LIMBS_2048
};

// Constants
global MAX_EMAIL_LENGTH: u32 = 320;
global MAX_HEADER_LENGTH: u32 = 1408;

fn main(
    header_bytes: [u8; MAX_HEADER_LENGTH],
    signature: [Field; KEY_LIMBS_2048],
    jwt_pubkey_modulus_limbs: [Field; KEY_LIMBS_2048],
    jwt_pubkey_redc_params_limbs: [Field; KEY_LIMBS_2048],
    domain: pub BoundedVec<u8, 64>
) {
    // Create BoundedVec from header bytes
    let header = BoundedVec {
        storage: header_bytes,
        len: MAX_HEADER_LENGTH,
    };

    // Initialize RSA public key for email verification
    let pubkey = RSAPubkey {
        modulus: jwt_pubkey_modulus_limbs,
        redc: jwt_pubkey_redc_params_limbs,
    };

    // Extract email address from header
    let from = "from".as_bytes();
    
    // Safety: This operation is safe because we're checking email format
    /// Safety: get_domain_start_index_in_email only reads from the email BoundedVec
    let domain_start = unsafe { get_domain_start_index_in_email(header) };
    assert(header.storage[domain_start - 1] == 64, "Missing '@'");
    
    // Compare with expected domain
    for i in 0..64 {
        if i < domain.len {
            assert(header.storage[domain_start + i] == domain.storage[i], "Invalid domain");
        }
    }
}

// Helper: Find index after '@' in email
unconstrained fn get_domain_start_index_in_email(email: BoundedVec<u8, MAX_HEADER_LENGTH>) -> u32 {
    let mut domain_index = 0;
    for i in 0..MAX_HEADER_LENGTH {
        if i < email.len {
            if email.storage[i] == ("@".as_bytes())[0] {
                domain_index = i + 1;
                break;
            }
        }
    }
    domain_index
} 