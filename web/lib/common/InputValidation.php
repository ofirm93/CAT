<?php

/*
 * ******************************************************************************
 * Copyright 2011-2017 DANTE Ltd. and GÉANT on behalf of the GN3, GN3+, GN4-1 
 * and GN4-2 consortia
 *
 * License: see the web/copyright.php file in the file structure
 * ******************************************************************************
 */

namespace web\lib\common;

class InputValidation {

    private function input_validation_error($customtext) {
        return "<p>" . _("Input validation error: ") . $customtext . "</p>";
    }

    public function Federation($input, $owner = NULL) {

        $temp = new \core\Federation($input);
        if ($owner == NULL) {
            return $temp;
        }

        foreach ($temp->listFederationAdmins() as $oneowner) {
            if ($oneowner == $owner) {
                return $temp;
            }
        }
        throw new Exception(input_validation_error("User is not federation administrator!"));
    }

    public function IdP($input, $owner = 0) {
        if (!is_numeric($input)) {
            throw new Exception(input_validation_error("Value for IdP is not an integer!"));
        }

        $temp = new \core\IdP($input); // constructor throws an exception if NX, game over

        if ($owner !== 0) { // check if the authenticated user is allowed to see this institution
            foreach ($temp->owner() as $oneowner) {
                if ($oneowner['ID'] == $owner) {
                    return $temp;
                }
            }
            throw new Exception(input_validation_error("This IdP identifier is not accessible!"));
        }
        return $temp;
    }

    public function Profile($input, $idpIdentifier = NULL) {
        if (!is_numeric($input)) {
            throw new Exception(input_validation_error("Value for profile is not an integer!"));
        }

        $temp = \core\ProfileFactory::instantiate($input); // constructor throws an exception if NX, game over

        if ($idpIdentifier !== NULL && $temp->institution != $idpIdentifier) {
            throw new Exception(input_validation_error("The profile does not belong to the IdP!"));
        }
        return $temp;
    }

    public function Device($input) {
        $devicelist = \devices\Devices::listDevices();
        if (!isset($devicelist[$input])) {
            throw new Exception(input_validation_error("This device does not exist!"));
        }
        return $input;
    }

    /**
     * 
     * @param string $input a string to be made SQL-safe
     * @param boolean $allowWhitespace whether some whitespace (e.g. newlines should be preserved (true) or redacted (false)
     * @return string the massaged string
     */
    public function string($input, $allowWhitespace = FALSE) {
    // always chop out invalid characters, and surrounding whitespace
    $retvalStep1 =  trim(iconv("UTF-8", "UTF-8//TRANSLIT", $input));
    // if some funny person wants to inject markup tags, remove them
    $retval = filter_var($retvalStep1, FILTER_SANITIZE_STRING, ["flags" => FILTER_FLAG_NO_ENCODE_QUOTES]);
    // unless explicitly wanted, take away intermediate disturbing whitespace
    // a simple "space" is NOT disturbing :-)
    if ($allowWhitespace === FALSE) {
        $afterWhitespace = preg_replace('/(\0|\r|\x0b|\t|\n)/', '', $retval);
    } else {
        // even if we allow whitespace, not pathological ones!
        $afterWhitespace = preg_replace('/(\0|\r|\x0b)/', '', $retval);
    }
    if (is_array($afterWhitespace)) {
        throw new Exception("This function has to be given a string and returns a string. preg_replace has generated an array instead!");
    }
    return $afterWhitespace;
}

public function integer($input) {
    if (is_numeric($input)) {
        return $input;
    }
    return FALSE;
}

public function consortium_oi($input) {
    $shallow = valid_string_db($input);
    if (strlen($shallow) != 6 && strlen($shallow) != 10) {
        return FALSE;
    }
    if (!preg_match("/^[a-fA-F0-9]+$/", $shallow)) {
        return FALSE;
    }
    return $shallow;
}

public function realm($input) {
    // basic string checks
    $check = valid_string_db($input);
    // bark on invalid constructs
    if (preg_match("/@/", $check) == 1) {
        echo input_validation_error(_("Realm contains an @ sign!"));
        return FALSE;
    }
    if (preg_match("/^\./", $check) == 1) {
        echo input_validation_error(_("Realm begins with a . (dot)!"));
        return FALSE;
    }
    if (preg_match("/\.$/", $check) == 1) {
        echo input_validation_error(_("Realm ends with a . (dot)!"));
        return FALSE;
    }
    if (preg_match("/\./", $check) == 0) {
        echo input_validation_error(_("Realm does not contain at least one . (dot)!"));
        return FALSE;
    }
    if (preg_match("/ /", $check) == 1) {
        echo input_validation_error(_("Realm contains spaces!"));
        return FALSE;
    }
    if (strlen($input) == 0) {
        echo input_validation_error(_("Realm is empty!"));
        return FALSE;
    }
    return $check;
}

public function User($input) {
    $retval = $input;
    if ($input != "" && !ctype_print($input)) {
        throw new Exception(input_validation_error("The user identifier is not an ASCII string!"));
    }
    return $retval;
}

public function token($input) {
    $retval = $input;
    if ($input != "" && preg_match('/[^0-9a-fA-F]/', $input) != 0) {
        throw new Exception(input_validation_error("Token is not a hexadecimal string!"));
    }
    return $retval;
}

/**
 * 
 * @param string $input a numeric value in range of a geo coordinate [-180;180]
 * @return string returns back the input if all is good; throws an Exception if out of bounds or not numeric
 * @throws Exception
 */
public function coordinate($input) {
    $oldlocale = setlocale(LC_NUMERIC, 0);
    setlocale(LC_NUMERIC, "en_GB");
    if (!is_numeric($input)) {
        throw new Exception(input_validation_error("Coordinate is not a numeric value!"));
    }
    setlocale(LC_NUMERIC, $oldlocale);
    // lat and lon are always in the range of [-180;+180]
    if ($input < -180 || $input > 180) {
        throw new Exception(input_validation_error("Coordinate is out of bounds. Which planet are you from?"));
    }
    return $input;
}

/**
 * 
 * @param string $input the string to be checked: is this a serialised array with lat/lon keys in a valid number range?
 * @return string returns $input if checks have passed; throws an Exception if something's wrong
 * @throws Exception
 */
public function coordSerialized($input) {
    $tentative = unserialize($input, ["allowed_classes" => false]);
    if (is_array($tentative)) {
        if (isset($tentative['lon']) && isset($tentative['lat']) && valid_coordinate($tentative['lon']) && valid_coordinate($tentative['lat'])) {
            return $input;
        }
    }
    throw new Exception(input_validation_error(_("Wrong coordinate encoding!")));
}

/**
 * This checks the state of a HTML GET/POST "boolean" (if not checked, no value
 * is submitted at all; if checked, has the word "on". Anything else is a big
 * error
 * @param string $input the string to test
 * @return string echoes back the input if good, throws an Exception otherwise
 * @throws Exception
 */
public function boolean($input) {
    if ($input != "on") {
        throw new Exception(input_validation_error("Unknown state of boolean option!"));
    }
    return $input;
}

public function databaseReference($input) {
    $rowindexmatch = [];

    if (preg_match("/IdP/", $input)) {
        $table = "institution_option";
    } elseif (preg_match("/Profile/", $input)) {
        $table = "profile_option";
    } elseif (preg_match("/FED/", $input)) {
        $table = "federation_option";
    } else {
        return FALSE;
    }
    if (preg_match("/.*-([0-9]*)/", $input, $rowindexmatch)) {
        $rowindex = $rowindexmatch[1];
    } else {
        return FALSE;
    }
    return ["table" => $table, "rowindex" => $rowindex];
}

public function hostname($input) {
    // is it a valid IP address (IPv4 or IPv6)?
    if (filter_var($input, FILTER_VALIDATE_IP)) {
        return $input;
    }
    // if not, it must be a host name. Use email validation by prefixing with a local part
    if (filter_var("stefan@" . $input, FILTER_VALIDATE_EMAIL)) {
        return $input;
    }
    // if we get here, it's bogus
    return FALSE;
}

}