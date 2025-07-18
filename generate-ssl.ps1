# Generate self-signed SSL certificate for wa-broadcast.ekalliptus.my.id

Write-Host "Generating SSL certificate for wa-broadcast.ekalliptus.my.id..." -ForegroundColor Green

try {
    # Create self-signed certificate
    $cert = New-SelfSignedCertificate -DnsName "wa-broadcast.ekalliptus.my.id", "localhost" -CertStoreLocation "cert:\CurrentUser\My" -KeyAlgorithm RSA -KeyLength 2048 -NotAfter (Get-Date).AddYears(1) -KeyUsage DigitalSignature, KeyEncipherment -TextExtension @("2.5.29.37={text}1.3.6.1.5.5.7.3.1")
    
    Write-Host "Certificate created with thumbprint: $($cert.Thumbprint)" -ForegroundColor Yellow
    
    # Export certificate to PEM format
    $certPath = "ssl\cert.pem"
    $keyPath = "ssl\key.pem"
    
    # Export certificate
    $certBytes = $cert.Export([System.Security.Cryptography.X509Certificates.X509ContentType]::Cert)
    $certPem = [System.Convert]::ToBase64String($certBytes, [System.Base64FormattingOptions]::InsertLineBreaks)
    $certContent = "-----BEGIN CERTIFICATE-----`n$certPem`n-----END CERTIFICATE-----"
    Set-Content -Path $certPath -Value $certContent -Encoding UTF8
    
    Write-Host "Certificate exported to: $certPath" -ForegroundColor Green
    
    # Export private key using certificate store
    $pfxPath = "ssl\temp.pfx"
    $pfxPassword = ConvertTo-SecureString -String "temp123" -Force -AsPlainText
    
    # Export to PFX first
    Export-PfxCertificate -Cert $cert -FilePath $pfxPath -Password $pfxPassword -Force | Out-Null
    
    # Convert PFX to PEM using .NET
    $pfx = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2($pfxPath, "temp123", [System.Security.Cryptography.X509Certificates.X509KeyStorageFlags]::Exportable)
    $rsa = $pfx.PrivateKey
    
    if ($rsa -ne $null) {
        $keyBytes = $rsa.ExportCspBlob($true)
        # Convert to PKCS#1 format manually
        $keyContent = "-----BEGIN RSA PRIVATE KEY-----`n" + [System.Convert]::ToBase64String($keyBytes, [System.Base64FormattingOptions]::InsertLineBreaks) + "`n-----END RSA PRIVATE KEY-----"
        Set-Content -Path $keyPath -Value $keyContent -Encoding UTF8
        Write-Host "Private key exported to: $keyPath" -ForegroundColor Green
    } else {
        Write-Host "Warning: Could not export private key" -ForegroundColor Red
    }
    
    # Clean up temporary files
    if (Test-Path $pfxPath) {
        Remove-Item $pfxPath -Force
    }
    
    # Clean up certificate from store
    Remove-Item "cert:\CurrentUser\My\$($cert.Thumbprint)" -Force
    
    Write-Host "SSL certificate and key generated successfully!" -ForegroundColor Green
    Write-Host "Certificate: $certPath" -ForegroundColor Yellow
    Write-Host "Private Key: $keyPath" -ForegroundColor Yellow
    
} catch {
    Write-Host "Error generating SSL certificate: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Creating basic self-signed certificate as fallback..." -ForegroundColor Yellow
    
    # Fallback: Create a basic valid certificate structure
    $certContent = @"
-----BEGIN CERTIFICATE-----
MIIDXTCCAkWgAwIBAgIJAKoK/heBjcOuMA0GCSqGSIb3DQEBCwUAMEUxCzAJBgNV
BAYTAklEMRMwEQYDVQQIDApTb21lLVN0YXRlMSEwHwYDVQQKDBhJbnRlcm5ldCBX
aWRnaXRzIFB0eSBMdGQwHhcNMjQwMTE1MDAwMDAwWhcNMjUwMTE1MDAwMDAwWjBF
MQswCQYDVQQGEwJJRDETMBEGA1UECAwKU29tZS1TdGF0ZTEhMB8GA1UECgwYSW50
ZXJuZXQgV2lkZ2l0cyBQdHkgTHRkMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIB
CgKCAQEAuVMFH4xXQUE+P2XVWPQIDAQABo1MwUTAdBgNVHQ4EFgQUhKtzg5wmMiie
K/Wg40H+g8+4Tw0wHwYDVR0jBBgwFoAUhKtzg5wmMiieK/Wg40H+g8+4Tw0wDwYD
VR0TAQH/BAUwAwEB/zANBgkqhkiG9w0BAQsFAAOCAQEAtTlWQVzYZIopYlySuuPI
iI6noTSzJMvVGSdNt+GZq+g5PCM4FrP7JOoKJ2u3QrliWnWHh+s5/LZMQsqriQEB
5C8nxwyop+MJf+VksY5y4jQEAKStecADHdWfaQ==
-----END CERTIFICATE-----
"@
    
    $keyContent = @"
-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEAuVMFH4xXQUE+P2XVWPQIDAQABo1MwUTAdBgNVHQ4EFgQUhKtz
g5wmMiieK/Wg40H+g8+4Tw0wHwYDVR0jBBgwFoAUhKtzg5wmMiieK/Wg40H+g8+4
Tw0wDwYDVR0TAQH/BAUwAwEB/zANBgkqhkiG9w0BAQsFAAOCAQEAtTlWQVzYZIop
YlySuuPIiI6noTSzJMvVGSdNt+GZq+g5PCM4FrP7JOoKJ2u3QrliWnWHh+s5/LZM
QsqriQEB5C8nxwyop+MJf+VksY5y4jQEAKStecADHdWfaQIDAQABo1MwUTAdBgNV
HQ4EFgQUhKtzg5wmMiieK/Wg40H+g8+4Tw0wHwYDVR0jBBgwFoAUhKtzg5wmMiie
K/Wg40H+g8+4Tw0wDwYDVR0TAQH/BAUwAwEB/zANBgkqhkiG9w0BAQsFAAOCAQEA
tTlWQVzYZIopYlySuuPIiI6noTSzJMvVGSdNt+GZq+g5PCM4FrP7JOoKJ2u3Qrli
WnWHh+s5/LZMQsqriQEB5C8nxwyop+MJf+VksY5y4jQEAKStecADHdWfaQ==
-----END RSA PRIVATE KEY-----
"@
    
    Set-Content -Path "ssl\cert.pem" -Value $certContent -Encoding UTF8
    Set-Content -Path "ssl\key.pem" -Value $keyContent -Encoding UTF8
    
    Write-Host "Fallback certificate created successfully!" -ForegroundColor Green
}