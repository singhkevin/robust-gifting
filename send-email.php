<?php
require 'config.php'; // Load secure credentials

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');

$data = json_decode(file_get_contents('php://input'), true);

if (!$data) {
    echo json_encode(["success" => false, "message" => "No data provided."]);
    exit;
}

// ==========================================
// 1. FORWARD DATA TO GOOGLE APPS SCRIPT
// ==========================================
$scriptUrl = 'https://script.google.com/macros/s/AKfycbxZHBuH-1aNUwhd44zgCUuClgv2Nx_bArH2MaGEHIC_i7O9A5xcinfqOWL_v85q7Ps5/exec';

// Use cURL to send POST request
$ch = curl_init($scriptUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data)); // Apps script handles URL encoded well
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
$gsResponse = curl_exec($ch);
curl_close($ch);

// ==========================================
// 2. SEND EMAIL VIA HOSTINGER (SMTP)
// ==========================================
require 'PHPMailer/src/Exception.php';
require 'PHPMailer/src/PHPMailer.php';
require 'PHPMailer/src/SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

$to = 'vivek@vivekscreation.com';
$subject = 'New Lead: ' . ($data['name'] ?? 'Unknown');

$message = "";
foreach ($data as $key => $value) {
    if ($key !== 'timestamp' && $key !== 'formName' && $key !== 'sourceWebsite' && $key !== 'pageUrl') {
        $message .= ucfirst($key) . ": " . $value . "\n";
    }
}
$message .= "\nPage URL: " . ($data['pageUrl'] ?? 'Unknown');
$message .= "\nTimestamp: " . ($data['timestamp'] ?? date('c'));

$mail = new PHPMailer(true);

try {
    // Server settings
    $mail->isSMTP();
    $mail->Host = 'smtp.hostinger.com';
    $mail->SMTPAuth = true;

    // ----------------------------------------------------
    // IMPORTANT: ENTER YOUR HOSTINGER EMAIL PASSWORD BELOW
    // ----------------------------------------------------
    $mail->Username = 'leads@therobustworld.com';
    $mail->Password = SMTP_PASSWORD; // Securely loaded from config.php

    $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
    $mail->Port = 465;

    // Recipients
    $mail->setFrom('leads@therobustworld.com', 'Robust Gifting');
    $mail->addAddress($to);
    $mail->addReplyTo($data['email'] ?? 'leads@therobustworld.com', $data['name'] ?? 'Lead');

    // Content
    $mail->isHTML(false);
    $mail->Subject = $subject;
    $mail->Body = $message;

    $mail->send();
    $success = true;
} catch (Exception $e) {
    $success = false;
    // Uncomment next line to see exact SMTP error if needed:
    // echo json_encode(["success" => false, "error" => $mail->ErrorInfo]); exit;
}

echo json_encode(["success" => $success, "gs_triggered" => true]);
?>