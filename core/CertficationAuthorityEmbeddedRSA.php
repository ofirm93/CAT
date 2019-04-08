<?php

/*
 * ******************************************************************************
 * Copyright 2011-2017 DANTE Ltd. and GÉANT on behalf of the GN3, GN3+, GN4-1 
 * and GN4-2 consortia
 *
 * License: see the web/copyright.php file in the file structure
 * ******************************************************************************
 */

namespace core;

use \Exception;

class CertificationAuthorityEmbeddedRSA extends EntityWithDBProperties implements CertificationAuthorityInterface {

    private const LOCATION_ROOT_CA = ROOT . "/config/SilverbulletClientCerts/rootca-RSA.pem";
    private const LOCATION_ISSUING_CA = ROOT . "/config/SilverbulletClientCerts/real-RSA.pem";
    private const LOCATION_ISSUING_KEY = ROOT . "/config/SilverbulletClientCerts/real-RSA.key";
    private const LOCATION_CONFIG = ROOT . "/config/SilverbulletClientCerts/openssl-RSA.cnf";

    /**
     * string with the PEM variant of the root CA
     * 
     * @var string
     */
    public $rootPem;

    /**
     * string with the PEM variant of the issuing CA
     * 
     * @var string
     */
    public $issuingCertRaw;

    /**
     * resource of the issuing CA
     * 
     * @var resource
     */
    private $issuingCert;

    /**
     * filename of the openssl.cnf file we use
     * @var string
     */
    private $conffile;

    /**
     * resource for private key
     * 
     * @var resource
     */
    private $issuingKey;

    public function __construct() {
        $this->databaseType = "INST";
        parent::__construct();
        $this->rootPem = file_get_contents(CertificationAuthorityEmbeddedRSA::LOCATION_ROOT_CA);
        if ($this->rootPem === FALSE) {
            throw new Exception("Root CA PEM file not found: " . CertificationAuthorityEmbeddedRSA::LOCATION_ROOT_CA);
        }
        $this->issuingCertRaw = file_get_contents(CertificationAuthorityEmbeddedRSA::LOCATION_ISSUING_CA);
        if ($this->issuingCertRaw === FALSE) {
            throw new Exception("Issuing CA PEM file not found: " . CertificationAuthorityEmbeddedRSA::LOCATION_ISSUING_CA);
        }
        $rootParsed = openssl_x509_read($this->rootPem);
        $this->issuingCert = openssl_x509_read($this->issuingCertRaw);
        if ($this->issuingCert === FALSE || $rootParsed === FALSE) {
            throw new Exception("At least one CA PEM file did not parse correctly!");
        }
        if (stat(CertificationAuthorityEmbeddedRSA::LOCATION_ISSUING_KEY) === FALSE) {
            throw new Exception("Private key not found: " . CertificationAuthorityEmbeddedRSA::LOCATION_ISSUING_KEY);
        }
        $issuingKeyTemp = openssl_pkey_get_private("file://" . CertificationAuthorityEmbeddedRSA::LOCATION_ISSUING_KEY);
        if ($issuingKeyTemp === FALSE) {
            throw new Exception("The private key did not parse correctly!");
        }
        $this->issuingKey = $issuingKeyTemp;
        if (stat(CertificationAuthorityEmbeddedRSA::LOCATION_CONFIG) === FALSE) {
            throw new Exception("openssl configuration not found: " . CertificationAuthorityEmbeddedRSA::LOCATION_CONFIG);
        }
        $this->conffile = CertificationAuthorityEmbeddedRSA::LOCATION_CONFIG;
    }

    public function triggerNewOCSPStatement(SilverbulletCertificate $cert): string {
        $certstatus = "";
        // get all relevant info from object properties
        if ($cert->serial >= 0) { // let's start with the assumption that the cert is valid
            if ($cert->revocationStatus == "REVOKED") {
                // already revoked, simply return canned OCSP response
                $certstatus = "R";
            } else {
                $certstatus = "V";
            }
        }

        $originalExpiry = date_create_from_format("Y-m-d H:i:s", $cert->expiry);
        if ($originalExpiry === FALSE) {
            throw new Exception("Unable to calculate original expiry date, input data bogus!");
        }
        $validity = date_diff(/** @scrutinizer ignore-type */ date_create(), $originalExpiry);
        if ($validity->invert == 1) {
            // negative! Cert is already expired, no need to revoke. 
            // No need to return anything really, but do return the last known OCSP statement to prevent special case
            $certstatus = "E";
        }
        $profile = new ProfileSilverbullet($cert->profileId);
        $inst = new IdP($profile->institution);
        $federation = strtoupper($inst->federation);
        // generate stub index.txt file
        $tempdirArray = \core\common\Entity::createTemporaryDirectory("test");
        $tempdir = $tempdirArray['dir'];
        $nowIndexTxt = (new \DateTime())->format("ymdHis") . "Z";
        $expiryIndexTxt = $originalExpiry->format("ymdHis") . "Z";
        $serialHex = strtoupper(dechex($cert->serial));
        if (strlen($serialHex) % 2 == 1) {
            $serialHex = "0" . $serialHex;
        }

        $indexStatement = "$certstatus\t$expiryIndexTxt\t" . ($certstatus == "R" ? "$nowIndexTxt,unspecified" : "") . "\t$serialHex\tunknown\t/O=" . CONFIG_CONFASSISTANT['CONSORTIUM']['name'] . "/OU=$federation/CN=$cert->username\n";
        $this->loggerInstance->debug(4, "index.txt contents-to-be: $indexStatement");
        if (!file_put_contents($tempdir . "/index.txt", $indexStatement)) {
            $this->loggerInstance->debug(1, "Unable to write openssl index.txt file for revocation handling!");
        }
        // index.txt.attr is dull but needs to exist
        file_put_contents($tempdir . "/index.txt.attr", "unique_subject = yes\n");
        // call "openssl ocsp" to manufacture our own OCSP statement
        // adding "-rmd sha1" to the following command-line makes the
        // choice of signature algorithm for the response explicit
        // but it's only available from openssl-1.1.0 (which we do not
        // want to require just for that one thing).
        $execCmd = CONFIG['PATHS']['openssl'] . " ocsp -issuer " . CertificationAuthorityEmbeddedRSA::LOCATION_ISSUING_CA . " -sha1 -ndays 10 -no_nonce -serial 0x$serialHex -CA " . CertificationAuthorityEmbeddedRSA::LOCATION_ISSUING_CA . " -rsigner " . CertificationAuthorityEmbeddedRSA::LOCATION_ISSUING_CA . " -rkey " . CertificationAuthorityEmbeddedRSA::LOCATION_ISSUING_KEY . " -index $tempdir/index.txt -no_cert_verify -respout $tempdir/$serialHex.response.der";
        $this->loggerInstance->debug(2, "Calling openssl ocsp with following cmdline: $execCmd\n");
        $output = [];
        $return = 999;
        exec($execCmd, $output, $return);
        if ($return !== 0) {
            throw new Exception("Non-zero return value from openssl ocsp!");
        }
        $ocsp = file_get_contents($tempdir . "/$serialHex.response.der");
        // remove the temp dir!
        unlink($tempdir . "/$serialHex.response.der");
        unlink($tempdir . "/index.txt.attr");
        unlink($tempdir . "/index.txt");
        rmdir($tempdir);
        $this->databaseHandle->exec("UPDATE silverbullet_certificate SET OCSP = ?, OCSP_timestamp = NOW() WHERE serial_number = ?", "si", $ocsp, $cert->serial);
        return $ocsp;
    }

    public function signRequest($csr, $expiryDays) {
        $nonDupSerialFound = FALSE;
        do {
            $serial = random_int(1000000000, PHP_INT_MAX);
            $rsa = \devices\Devices::SUPPORT_EMBEDDED_RSA;
            $dupeQuery = $this->databaseHandle->exec("SELECT serial_number FROM silverbullet_certificate WHERE serial_number = ? AND ca_type = ?", "is", $serial, $rsa);
            // SELECT -> resource, not boolean
            if (mysqli_num_rows(/** @scrutinizer ignore-type */$dupeQuery) == 0) {
                $nonDupSerialFound = TRUE;
            }
        } while (!$nonDupSerialFound);
        $this->loggerInstance->debug(5, "generateCertificate: signing imminent with unique serial $serial, cert type RSA.\n");
        $cert = openssl_csr_sign($csr, $this->issuingCert, $this->issuingCaKey, $expiryDays, ['digest_alg' => 'sha256', 'config' => $this->conffile], $serial);
        if ($cert === FALSE) {
            throw new Exception("Unable to sign the request and generate the certificate!");
        }
        return [
            "CERT" => $cert,
            "SERIAL" => $serial,
            "ISSUER" => $this->issuingCertRaw,
            "ROOT" => $this->rootPem,
        ];
    }

    public function revokeCertificate(SilverbulletCertificate $cert): void {
        // the generic caller in SilverbulletCertificate::revokeCertificate
        // has already updated the DB. So all is done; we simply create a new
        // OCSP statement based on the updated DB content
        $this->triggerNewOCSPStatement($cert);
    }

    public function generateCompatibleCsr($privateKey, $fed, $username) {
        $newCsr = openssl_csr_new(
                ['O' => CONFIG_CONFASSISTANT['CONSORTIUM']['name'],
                    'OU' => $fed,
                    'CN' => $username,
                // 'emailAddress' => $username,
                ], $privateKey, [
            'digest_alg' => "sha256",
            'req_extensions' => 'v3_req',
                ]
        );
        if ($newCsr === FALSE) {
            throw new Exception("Unable to create a CSR!");
        }
        return [
            "CSR" => $newCsr, // resource
            "USERNAME" => $username,
            "FED" => $fed
        ];
    }

    public function generateCompatiblePrivateKey(): resource {
        $key = openssl_pkey_new(['private_key_bits' => 2048, 'private_key_type' => OPENSSL_KEYTYPE_RSA, 'encrypt_key' => FALSE]);
        if ($key === FALSE) {
            throw new Exception("Unable to generate a private key.");
        }
        return $key;
    }

    /**
     * CAs don't have any local caching or other freshness issues
     * 
     * @return void
     */
    public function updateFreshness() {
        // nothing to be done here.
    }

}