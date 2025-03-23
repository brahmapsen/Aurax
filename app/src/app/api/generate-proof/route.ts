import { NextResponse } from 'next/server';
import { generateInputs } from 'noir-jwt';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

async function getGooglePublicKey(kid: string) {
  const response = await axios.get(
    'https://www.googleapis.com/oauth2/v3/certs'
  );
  const keys = response.data.keys;
  return keys.find((key: any) => key.kid === kid);
}

async function verifyGoogleToken(token: string) {
  try {
    const response = await axios.get(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${token}`
    );
    return response.data;
  } catch (error) {
    console.error('Token verification failed:', error);
    throw new Error('Invalid token');
  }
}

async function compileIfNeeded(circuitPath: string) {
  const pmJsonPath = path.join(circuitPath, 'target', 'pm.json');

  if (!fs.existsSync(pmJsonPath)) {
    console.log('pm.json not found, compiling circuit...');
    const compileCommand = `cd ${circuitPath} && nargo compile`;
    await execAsync(compileCommand);
    console.log('Circuit compiled successfully');
  } else {
    console.log('Using existing pm.json');
  }
}

async function generateVkIfNeeded(circuitPath: string) {
  const vkPath = path.join(circuitPath, 'target', 'vk');

  if (!fs.existsSync(vkPath)) {
    console.log('vk file not found, generating key...');
    const keyCommand = `cd ${circuitPath} && bb write_vk -b ./target/pm.json -o ./target/vk`;
    await execAsync(keyCommand);
    console.log('KEY created successfully');
  } else {
    console.log('Using existing vk file');
  }
}

function generateTomlContent(data: any): string {
  const formatArray = (arr: any[]) => `[${arr.join(', ')}]`;

  let content = '';

  // Handle domain data
  if (data.domain) {
    content += `domain = { storage = [${data.domain.storage.join(
      ', '
    )}], len = ${data.domain.len} }\n\n`;
  }

  // Handle JWT data if present
  if (data.partial_data) {
    content += `partial_data = { storage = [${data.partial_data.storage.join(
      ', '
    )}], len = ${data.partial_data.len} }\n\n`;
    content += `partial_hash = ${formatArray(data.partial_hash)}\n\n`;
    content += `full_data_length = ${data.full_data_length}\n\n`;
    content += `base64_decode_offset = ${data.base64_decode_offset}\n\n`;
    content += `jwt_pubkey_modulus_limbs = ${formatArray(
      data.jwt_pubkey_modulus_limbs
    )}\n\n`;
    content += `jwt_pubkey_redc_params_limbs = ${formatArray(
      data.jwt_pubkey_redc_params_limbs
    )}\n\n`;
    content += `jwt_signature_limbs = ${formatArray(data.jwt_signature_limbs)}`;
  }

  return content;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id_token, email, type } = body;

    console.log('Starting proof generation for email:', email);

    if (!email) {
      return NextResponse.json({ error: 'Missing email' }, { status: 400 });
    }

    const domain = email.split('@')[1];
    console.log('Validating domain:', domain);

    const circuitPath = path.join(process.cwd(), '../circuit');
    const tomlPath = path.join(circuitPath, 'Prover.toml');

    try {
      let proverData;

      if (type === 'domain') {
        // For email login, only include domain verification data
        console.log('Generating domain-only verification data...');
        proverData = {
          domain: {
            storage: Array.from(new TextEncoder().encode(domain))
              .concat(new Array(64).fill(0))
              .slice(0, 64),
            len: domain.length,
          },
          // Add dummy values for JWT fields
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
        // For Google login, verify JWT
        if (!id_token) {
          return NextResponse.json(
            { error: 'Missing id_token for JWT verification' },
            { status: 400 }
          );
        }

        console.log('Generating JWT verification data...');
        const [headerB64] = id_token.split('.');
        const header = JSON.parse(Buffer.from(headerB64, 'base64').toString());
        const pubkey = await getGooglePublicKey(header.kid);

        const jwtInputs = await generateInputs({
          jwt: id_token,
          pubkey,
          maxSignedDataLength: 1200,
          shaPrecomputeTillKeys: ['email', 'email_verified'],
        });

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
            storage: Array.from(new TextEncoder().encode(domain))
              .concat(new Array(64).fill(0))
              .slice(0, 64),
            len: domain.length,
          },
        };
      }

      console.log('Writing Prover.toml...');
      const tomlContent = generateTomlContent(proverData);
      fs.writeFileSync(tomlPath, tomlContent);

      // Compile if needed
      await compileIfNeeded(circuitPath);

      // Generate proof
      console.log('Executing proof generation...');
      await execAsync(
        `cd ${circuitPath} && bb prove -b ./target/pm.json -w ./target/pm.gz -o ./target/proof`
      );
      console.log('Proof generated successfully');

      // Generate verification key if needed and verify proof
      await generateVkIfNeeded(circuitPath);

      console.log('Verifying proof...');
      await execAsync(
        `cd ${circuitPath} && bb verify -k ./target/vk -p ./target/proof`
      );
      console.log('Proof verified successfully');

      // Determine expert status
      const expertDomains = ['gmail.com', 'edu']; // Add your expert domains here
      const isExpertDomain = expertDomains.some((expertDomain) =>
        domain.endsWith(expertDomain)
      );

      // For domain verification, return verified: true
      if (type === 'domain') {
        return NextResponse.json({
          verified: true,
          verifiedDomain: domain,
          isExpert: false, // domain-only verification cannot grant expert status
          message: 'Domain verification successful',
        });
      } else {
        // For JWT verification
        return NextResponse.json({
          verified: true,
          verifiedDomain: domain,
          isExpert: isExpertDomain,
          message: isExpertDomain
            ? 'JWT verification successful - Expert status granted'
            : 'JWT verification successful',
        });
      }
    } catch (error) {
      console.error('Error in proof generation/verification:', error);
      return NextResponse.json(
        {
          verified: false,
          isExpert: false,
          error: 'Proof verification failed',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error in generate-proof route:', error);
    return NextResponse.json(
      {
        verified: false,
        isExpert: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
