// Copyright (c) 2025 Robert "RJDC" Clinkenbeard. All rights reserved.

import type { Request, Response, NextFunction } from 'express';

// List of common crawler user agents
const crawlerUserAgents = [
  'googlebot',
  'bingbot',
  'slurp',
  'duckduckbot',
  'baiduspider',
  'yandexbot',
  'facebookexternalhit',
  'twitterbot',
  'whatsapp',
  'linkedinbot',
  'discordbot',
  'telegrambot',
  'slackbot',
  'applebot',
  'pinterest',
  'tumblr',
  'vkshare',
  'outbrain',
  'quora link preview',
  'redditbot',
  'snapchat',
  'skypeuripreview',
  'gptbot',
  'chatgpt',
  'anthropic',
  'claude',
  'perplexitybot'
];

// Check if the request is from a crawler
export function isCrawler(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return crawlerUserAgents.some(crawler => ua.includes(crawler));
}

// Pre-rendered HTML content for each SEO-critical route
const prerenderContent: Record<string, string> = {
  '/': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BadBlue | File Police Complaint Online | Sue Officers for Misconduct</title>
  <meta name="description" content="Professional platform to file police complaints online, sue officers for misconduct & civil rights violations. Report bad cops, excessive force & brutality. Justice accessibility tools.">
  <meta name="keywords" content="file police complaint online, sue police officer, police misconduct, civil rights violations, excessive force, police brutality, bad cops, police accountability">
  <meta property="og:title" content="BadBlue | File Police Complaint Online | Sue Officers for Misconduct">
  <meta property="og:description" content="Professional platform to file police complaints online, sue officers for misconduct & civil rights violations. Report bad cops, excessive force & brutality.">
  <meta property="og:url" content="https://bad-blue.com/">
  <meta property="og:image" content="https://bad-blue.com/preview.png">
  <meta property="og:type" content="website">
  <link rel="canonical" href="https://bad-blue.com/">
</head>
<body>
  <h1>File Police Complaints Online & Sue Officers for Misconduct</h1>
  <p>BadBlue is the premier professional platform for police accountability and civil rights protection. We provide comprehensive tools to file police complaints online, sue officers for misconduct, and protect your constitutional rights.</p>
  <h2>Our Services</h2>
  <ul>
    <li>File Police Complaints - Report misconduct, excessive force, and civil rights violations</li>
    <li>Section 1983 Lawsuits - Sue officers for constitutional violations under federal law</li>
    <li>FOIA Requests - Access police records and body camera footage</li>
    <li>Officer Database - Research officer histories and misconduct records</li>
    <li>Evidence Management - Secure storage for documentation and videos</li>
  </ul>
  <p>Join thousands who have successfully held bad cops accountable through our platform. Professional legal document generation, automated routing to authorities, and comprehensive case management tools.</p>
</body>
</html>`,
  '/landing': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>File Police Complaint Online | BadBlue Professional Platform</title>
  <meta name="description" content="Professional police accountability platform. File complaints against bad cops, report excessive force, document misconduct. Automated routing to proper authorities.">
  <meta name="keywords" content="file police complaint, report bad cops, police brutality, excessive force, civil rights, police accountability">
  <meta property="og:title" content="File Police Complaint Online | BadBlue">
  <meta property="og:description" content="Professional platform to file police complaints, report misconduct, and protect civil rights.">
  <meta property="og:url" content="https://bad-blue.com/landing">
  <link rel="canonical" href="https://bad-blue.com/landing">
</head>
<body>
  <h1>File Police Complaints Online & Sue Officers for Misconduct</h1>
  <p>BadBlue is the professional platform for police accountability. We help citizens file formal complaints against police officers, document misconduct, and protect civil rights through comprehensive legal tools.</p>
  <h2>Key Features</h2>
  <ul>
    <li>Professional complaint document generation</li>
    <li>Automated routing to proper authorities</li>
    <li>Section 1983 civil rights lawsuits</li>
    <li>FOIA request processing</li>
    <li>Officer misconduct database</li>
    <li>Secure evidence storage</li>
  </ul>
  <p>Our platform has helped thousands successfully file complaints and lawsuits against bad cops, resulting in accountability and justice for victims of police misconduct.</p>
</body>
</html>`,
  '/complaint': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>File Police Complaint Online | Report Bad Cops & Police Misconduct</title>
  <meta name="description" content="File formal police complaints online for misconduct, excessive force, brutality & civil rights violations. Professional document generation with automated routing.">
  <meta name="keywords" content="file police complaint online, police misconduct complaint form, report police brutality, excessive force complaint, civil rights violations">
  <meta property="og:title" content="File Police Complaint Online | BadBlue">
  <meta property="og:description" content="Professional platform to file formal police complaints. Report misconduct, excessive force, and civil rights violations.">
  <meta property="og:url" content="https://bad-blue.com/complaint">
  <link rel="canonical" href="https://bad-blue.com/complaint">
</head>
<body>
  <h1>File Police Complaint Online</h1>
  <p>Report police misconduct, excessive force, and civil rights violations through our professional complaint filing system. BadBlue generates formal complaint documents and automatically routes them to the appropriate authorities.</p>
  <h2>What You Can Report</h2>
  <ul>
    <li>Excessive Force and Police Brutality</li>
    <li>False Arrest and Wrongful Detention</li>
    <li>Illegal Search and Seizure</li>
    <li>Racial Profiling and Discrimination</li>
    <li>Harassment and Intimidation</li>
    <li>Corruption and Abuse of Authority</li>
  </ul>
  <h2>Our Process</h2>
  <ol>
    <li>Complete the online complaint form with incident details</li>
    <li>Upload supporting evidence (photos, videos, documents)</li>
    <li>Review the professionally generated complaint document</li>
    <li>We automatically file with the appropriate oversight agencies</li>
    <li>Track your complaint status through our platform</li>
  </ol>
</body>
</html>`,
  '/complaint-form': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>File Police Complaint Form | Report Officer Misconduct Online</title>
  <meta name="description" content="Complete online form to file police complaints for misconduct, brutality, excessive force. Professional document generation with automated filing.">
  <meta name="keywords" content="police complaint form, officer misconduct form, file complaint against police, report bad cops online">
  <meta property="og:title" content="Police Complaint Form | BadBlue">
  <meta property="og:description" content="File formal complaints against police officers online. Professional document generation and automated routing.">
  <meta property="og:url" content="https://bad-blue.com/complaint-form">
  <link rel="canonical" href="https://bad-blue.com/complaint-form">
</head>
<body>
  <h1>Police Complaint Filing Form</h1>
  <p>Use this professional form to file a formal complaint against a police officer or department for misconduct, excessive force, or civil rights violations.</p>
  <h2>Information Needed</h2>
  <ul>
    <li>Officer name and badge number (if known)</li>
    <li>Department and precinct information</li>
    <li>Date, time, and location of incident</li>
    <li>Detailed description of misconduct</li>
    <li>Witness information</li>
    <li>Supporting evidence (photos, videos, documents)</li>
  </ul>
  <p>Our system generates professional complaint documents and automatically routes them to Internal Affairs, Civilian Review Boards, and other appropriate oversight agencies.</p>
</body>
</html>`,
  '/foia': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FOIA Request for Police Records | Body Camera Footage | BadBlue</title>
  <meta name="description" content="File FOIA requests for police records, body camera footage, incident reports. Professional document generation for Freedom of Information Act requests.">
  <meta name="keywords" content="FOIA request police, body camera footage, police records request, freedom of information act">
  <meta property="og:title" content="FOIA Request for Police Records | BadBlue">
  <meta property="og:description" content="Request police records, body camera footage, and incident reports through FOIA. Professional document generation.">
  <meta property="og:url" content="https://bad-blue.com/foia">
  <link rel="canonical" href="https://bad-blue.com/foia">
</head>
<body>
  <h1>FOIA Request for Police Records</h1>
  <p>Use the Freedom of Information Act to request police records, body camera footage, incident reports, and other documentation. BadBlue generates professional FOIA requests that comply with federal and state requirements.</p>
  <h2>What You Can Request</h2>
  <ul>
    <li>Body Camera and Dashcam Footage</li>
    <li>Incident and Arrest Reports</li>
    <li>Officer Disciplinary Records</li>
    <li>Department Policies and Procedures</li>
    <li>Use of Force Reports</li>
    <li>Internal Affairs Investigation Files</li>
  </ul>
  <h2>FOIA Process</h2>
  <ol>
    <li>Specify the records you need</li>
    <li>We generate a compliant FOIA request</li>
    <li>Request is sent to the appropriate agency</li>
    <li>Track response deadlines and appeals</li>
  </ol>
</body>
</html>`,
  '/foia-request-form': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FOIA Request Form | Get Police Records & Body Camera Footage</title>
  <meta name="description" content="Submit FOIA requests for police records, body camera footage, incident reports. Professional Freedom of Information Act request generation.">
  <meta name="keywords" content="FOIA request form, police records request, body camera footage request, freedom of information">
  <meta property="og:title" content="FOIA Request Form | BadBlue">
  <meta property="og:description" content="Professional FOIA request form for police records and body camera footage.">
  <meta property="og:url" content="https://bad-blue.com/foia-request-form">
  <link rel="canonical" href="https://bad-blue.com/foia-request-form">
</head>
<body>
  <h1>FOIA Request Form</h1>
  <p>Complete this form to request police records, body camera footage, and other documentation under the Freedom of Information Act.</p>
  <h2>Request Details</h2>
  <ul>
    <li>Type of records needed</li>
    <li>Date range of incidents</li>
    <li>Officer or case information</li>
    <li>Specific documents or footage</li>
  </ul>
  <p>We generate professional FOIA requests that comply with all requirements and automatically send them to the correct agencies.</p>
</body>
</html>`,
  '/1983': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Section 1983 Civil Rights Lawsuits | Sue Police Officers | BadBlue</title>
  <meta name="description" content="File Section 1983 lawsuits against police officers for constitutional violations, excessive force, false arrest. Federal civil rights lawsuit assistance.">
  <meta name="keywords" content="section 1983 lawsuit, sue police officer, civil rights lawsuit, constitutional violations, excessive force lawsuit">
  <meta property="og:title" content="Section 1983 Civil Rights Lawsuits | BadBlue">
  <meta property="og:description" content="Sue police officers for constitutional violations under Section 1983. Professional lawsuit document preparation.">
  <meta property="og:url" content="https://bad-blue.com/1983">
  <link rel="canonical" href="https://bad-blue.com/1983">
</head>
<body>
  <h1>Section 1983 Civil Rights Lawsuits Against Police Officers</h1>
  <p>42 U.S.C. § 1983 allows citizens to sue police officers and government officials for constitutional violations. BadBlue provides professional assistance in preparing and filing Section 1983 lawsuits for police misconduct.</p>
  <h2>Common Section 1983 Claims</h2>
  <ul>
    <li>Excessive Force (Fourth Amendment)</li>
    <li>False Arrest and Imprisonment</li>
    <li>Malicious Prosecution</li>
    <li>Failure to Intervene</li>
    <li>Deliberate Indifference to Medical Needs</li>
    <li>First Amendment Retaliation</li>
  </ul>
  <h2>Elements of a Section 1983 Claim</h2>
  <ol>
    <li>Action under color of state law</li>
    <li>Deprivation of constitutional rights</li>
    <li>Causation between conduct and injury</li>
    <li>Damages resulting from violation</li>
  </ol>
  <h2>Qualified Immunity</h2>
  <p>Police officers often claim qualified immunity as a defense. We help document clearly established rights violations to overcome this defense and hold officers accountable.</p>
  <h2>Available Remedies</h2>
  <ul>
    <li>Compensatory damages for injuries</li>
    <li>Punitive damages for egregious conduct</li>
    <li>Attorney fees under 42 U.S.C. § 1988</li>
    <li>Injunctive relief to prevent future violations</li>
  </ul>
</body>
</html>`
};

// Middleware to handle pre-rendering for crawlers
export function prerenderMiddleware(req: Request, res: Response, next: NextFunction) {
  const userAgent = req.headers['user-agent'] || '';
  const path = req.path;
  
  // Check if this is a crawler and the path is SEO-critical
  if (isCrawler(userAgent) && prerenderContent[path]) {
    // Send pre-rendered HTML for crawlers
    res.set('Content-Type', 'text/html');
    res.send(prerenderContent[path]);
    return;
  }
  
  // For regular users, continue to the SPA
  next();
}