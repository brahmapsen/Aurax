import { NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import { generateInputs } from 'noir-jwt';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

const GOOGLE_CLIENT_ID =
  '966100421808-9fcdcovoaq2866o82pglo1v8f2u4q9n0.apps.googleusercontent.com';

const client = new OAuth2Client(GOOGLE_CLIENT_ID);

interface BoundedVec {
  storage: number[];
  len: number;
}

interface ProverData {
  domain?: BoundedVec;
  partial_data?: BoundedVec;
  partial_hash?: number[];
  full_data_length?: number;
  base64_decode_offset?: number;
  jwt_pubkey_modulus_limbs?: number[];
  jwt_pubkey_redc_params_limbs?: number[];
  jwt_signature_limbs?: number[];
}

async function getGooglePublicKey(kid: string) {
  const response = await axios.get(
    'https://www.googleapis.com/oauth2/v3/certs'
  );
  const keys = response.data.keys;
  return keys.find((key: any) => key.kid === kid);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, id_token, type } = body;

    if (!email) {
      return NextResponse.json({ error: 'Missing email' }, { status: 400 });
    }

    const domain = email.split('@')[1] || '';
    let proverData: any = {};

    if (type === 'domain') {
      // Domain-only verification
      const domainBytes = Array.from(new TextEncoder().encode(domain))
        .concat(new Array(64).fill(0))
        .slice(0, 64);

      proverData = {
        domain: {
          storage: domainBytes,
          len: domain.length,
        },
        // Add dummy values for JWT fields to satisfy circuit requirements
        partial_data: {
          storage: new Array(1200).fill(0),
          len: 0,
        },
        partial_hash: new Array(32).fill(0),
        full_data_length: 0,
        base64_decode_offset: 0,
        jwt_pubkey_modulus_limbs: new Array(32).fill(0),
        jwt_pubkey_redc_params_limbs: new Array(32).fill(0),
        jwt_signature_limbs: new Array(32).fill(0),
      };
    } else {
      // JWT verification
      if (!id_token) {
        return NextResponse.json(
          { error: 'Missing id_token' },
          { status: 400 }
        );
      }

      const ticket = await client.verifyIdToken({
        idToken: id_token,
        audience: GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new Error('Empty payload');
      }

      const [headerB64] = id_token.split('.');
      const header = JSON.parse(Buffer.from(headerB64, 'base64').toString());
      const pubkey = await getGooglePublicKey(header.kid);

      const jwtInputs = await generateInputs({
        jwt: id_token,
        pubkey,
        maxSignedDataLength: 1200,
        shaPrecomputeTillKeys: ['email', 'email_verified'],
      });

      const domainBytes = Array.from(new TextEncoder().encode(domain))
        .concat(new Array(64).fill(0))
        .slice(0, 64);

      proverData = {
        partial_data: {
          storage: Array.from(jwtInputs.partial_data?.storage || [])
            .concat(new Array(1200).fill(0))
            .slice(0, 1200),
          len: jwtInputs.partial_data?.len || 0,
        },
        partial_hash: jwtInputs.partial_hash,
        full_data_length: jwtInputs.full_data_length,
        base64_decode_offset: jwtInputs.base64_decode_offset,
        jwt_pubkey_modulus_limbs: jwtInputs.pubkey_modulus_limbs,
        jwt_pubkey_redc_params_limbs: jwtInputs.redc_params_limbs,
        jwt_signature_limbs: jwtInputs.signature_limbs,
        domain: {
          storage: domainBytes,
          len: domain.length,
        },
      };
    }

    // Save as TOML
    const filePath = path.join(process.cwd(), 'public', 'Prover.toml');
    console.log('Creating Prover.toml at:', filePath);

    const tomlContent = Object.entries(proverData as ProverData)
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          if (key.includes('limbs')) {
            return `${key} = [${value.map((v) => `"${v}"`).join(', ')}]`;
          }
          return `${key} = [${value.join(', ')}]`;
        }
        if (
          value &&
          typeof value === 'object' &&
          'storage' in value &&
          'len' in value &&
          Array.isArray((value as BoundedVec).storage)
        ) {
          const boundedVec = value as BoundedVec;
          return `${key} = { storage = [${boundedVec.storage.join(
            ', '
          )}], len = ${boundedVec.len} }`;
        }
        return `${key} = ${value}`;
      })
      .join('\n\n');

    fs.writeFileSync(filePath, tomlContent);

    return NextResponse.json({
      success: true,
      filePath,
      email,
      domain,
    });
  } catch (error) {
    console.error('❌ Error processing request:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Processing failed' },
      { status: 500 }
    );
  }
}
