<?php
/**
 * Aura North America — quote request handler
 *
 * CONFIGURE BEFORE LAUNCH:
 *   $TO — the inbox that receives quote requests. Use a mailbox that exists
 *   on this Hostinger account (create one in hPanel > Emails) so mail is
 *   not flagged as spoofed.
 */
$TO        = 'support@auranorthamerica.com';
$FROM      = 'website@auranorthamerica.com'; // must be a mailbox/domain on this hosting account
$SUBJECT   = 'New quote request — auranorthamerica.com';
$MAX_BYTES = 10 * 1024 * 1024; // 10 MB upload cap
$ALLOWED   = ['pdf','step','stp','igs','iges','dwg','dxf','sldprt','zip','png','jpg','jpeg'];

header('Content-Type: application/json; charset=utf-8');

function fail(string $msg, int $code = 400): void {
    http_response_code($code);
    echo json_encode(['ok' => false, 'error' => $msg]);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    fail('Method not allowed', 405);
}

/* Honeypot: real users never fill this hidden field */
if (!empty($_POST['website'] ?? '')) {
    echo json_encode(['ok' => true]); // pretend success to bots
    exit;
}

/* Collect + sanitize (strip CR/LF to block header injection) */
function field(string $key, int $max = 500): string {
    $v = trim((string)($_POST[$key] ?? ''));
    $v = str_replace(["\r", "\n"], ' ', $v);
    return mb_substr($v, 0, $max);
}

$name     = field('name', 120);
$company  = field('company', 160);
$email    = field('email', 160);
$phone    = field('phone', 60);
$part     = field('part', 160);
$quantity = field('quantity', 120);
$process  = field('process', 120);
$material = field('material', 160);
$location = field('location', 160);
$date     = field('date', 120);
$message  = trim((string)($_POST['message'] ?? ''));
$message  = mb_substr($message, 0, 5000);

if ($name === '' || $company === '' || $message === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    fail('Please fill in your name, company, a valid email and the project description.');
}

/* Optional attachment */
$attachment = null;
if (!empty($_FILES['drawing']['name']) && ($_FILES['drawing']['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE) {
    $f = $_FILES['drawing'];
    if ($f['error'] !== UPLOAD_ERR_OK) {
        fail('The file upload failed — please try again or email the file to us directly.');
    }
    if ($f['size'] > $MAX_BYTES) {
        fail('The file is larger than 10 MB — please email it to us directly instead.');
    }
    $ext = strtolower(pathinfo($f['name'], PATHINFO_EXTENSION));
    if (!in_array($ext, $ALLOWED, true)) {
        fail('That file type is not accepted. Allowed: PDF, STEP, STP, IGS, DWG, DXF, SLDPRT, ZIP, PNG, JPG.');
    }
    if (!is_uploaded_file($f['tmp_name'])) {
        fail('Upload could not be verified.');
    }
    $safeName   = preg_replace('/[^A-Za-z0-9._-]/', '_', basename($f['name']));
    $attachment = [
        'name' => $safeName,
        'data' => (string)file_get_contents($f['tmp_name']),
    ];
}

/* Build the email body */
$lines = [
    "New quote request from auranorthamerica.com",
    str_repeat('-', 46),
    "Name:               $name",
    "Company:            $company",
    "Email:              $email",
    "Phone:              " . ($phone ?: '—'),
    "",
    "Part:               " . ($part ?: '—'),
    "Quantity / year:    " . ($quantity ?: '—'),
    "Process:            " . ($process ?: '—'),
    "Material:           " . ($material ?: '—'),
    "Delivery location:  " . ($location ?: '—'),
    "Required date:      " . ($date ?: '—'),
    "Attachment:         " . ($attachment ? $attachment['name'] : 'none'),
    "",
    "Project description:",
    str_repeat('-', 46),
    $message,
];
$body = implode("\r\n", $lines);

/* Compose MIME message (plain text + optional attachment) */
$boundary = 'b' . bin2hex(random_bytes(12));
$headers  = "From: Aura Website <$FROM>\r\n";
$headers .= "Reply-To: $name <$email>\r\n";
$headers .= "MIME-Version: 1.0\r\n";

if ($attachment) {
    $headers .= "Content-Type: multipart/mixed; boundary=\"$boundary\"\r\n";
    $mime  = "--$boundary\r\n";
    $mime .= "Content-Type: text/plain; charset=utf-8\r\n";
    $mime .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
    $mime .= $body . "\r\n\r\n";
    $mime .= "--$boundary\r\n";
    $mime .= "Content-Type: application/octet-stream; name=\"{$attachment['name']}\"\r\n";
    $mime .= "Content-Transfer-Encoding: base64\r\n";
    $mime .= "Content-Disposition: attachment; filename=\"{$attachment['name']}\"\r\n\r\n";
    $mime .= chunk_split(base64_encode($attachment['data']));
    $mime .= "--$boundary--\r\n";
} else {
    $headers .= "Content-Type: text/plain; charset=utf-8\r\n";
    $headers .= "Content-Transfer-Encoding: 8bit\r\n";
    $mime = $body;
}

$sent = mail($TO, $SUBJECT, $mime, $headers);

if (!$sent) {
    fail('The server could not send the email. Please email us directly.', 500);
}

echo json_encode(['ok' => true]);
