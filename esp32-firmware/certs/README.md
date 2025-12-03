# AWS IoT Certificates

Place your AWS IoT certificates in this directory:

1. **root_ca.pem** - Amazon Root CA certificate
   - Download from: https://www.amazontrust.com/repository/AmazonRootCA1.pem

2. **device_cert.pem** - Your device certificate
   - Generated in AWS IoT Console when creating a Thing

3. **device_key.pem** - Your device private key
   - Generated in AWS IoT Console when creating a Thing

## Usage

The certificates are automatically embedded into the firmware during build.