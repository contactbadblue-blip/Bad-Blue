import PDFDocument from 'pdfkit';
import { Readable } from 'stream';

export interface LawsuitPDFData {
  plaintiffName: string;
  plaintiffAddress: string;
  defendantOfficerName: string;
  defendantDepartment: string;
  state: string;
  county: string;
  city: string;
  incidentDate: string;
  lawsuitType: string;
  description: string;
  damagesRequested: number; // in cents
  generatedDocument: string; // The full legal document text
}

export interface CoverSheetPDFData {
  plaintiffName: string;
  plaintiffAddress: string;
  plaintiffPhone?: string;
  plaintiffEmail?: string;
  defendantName: string;
  caseType: string;
  state: string;
  county: string;
  filingDate: string;
  damagesRequested: number; // in cents
}

export async function generateLawsuitPDF(data: LawsuitPDFData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'LETTER',
      margins: {
        top: 72, // 1 inch
        bottom: 72,
        left: 72,
        right: 72
      }
    });

    const buffers: Buffer[] = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      resolve(pdfData);
    });
    doc.on('error', reject);

    // Header
    doc.fontSize(14).font('Helvetica-Bold');
    doc.text(`IN THE ${data.county ? data.county.toUpperCase() + ' COUNTY' : ''} COURT`, { align: 'center' });
    doc.text(`STATE OF ${data.state}`, { align: 'center' });
    doc.moveDown(2);

    // Case caption
    doc.fontSize(12).font('Helvetica');
    doc.text(data.plaintiffName.toUpperCase(), { align: 'left' });
    doc.text('Plaintiff,', { align: 'left' });
    doc.moveDown(0.5);
    doc.text('v.', { align: 'center' });
    doc.moveDown(0.5);
    doc.text(data.defendantOfficerName.toUpperCase(), { align: 'left' });
    doc.text(`Badge # (if known), ${data.defendantDepartment}`, { align: 'left' });
    doc.text('Defendant.', { align: 'left' });
    doc.moveDown(2);

    // Document title
    doc.fontSize(14).font('Helvetica-Bold');
    doc.text('COMPLAINT FOR CIVIL RIGHTS VIOLATIONS', { align: 'center' });
    doc.text('(42 U.S.C. § 1983)', { align: 'center' });
    doc.moveDown(2);

    // Main document content
    doc.fontSize(11).font('Helvetica');
    
    // Split the generated document into paragraphs and format
    const paragraphs = data.generatedDocument.split('\n\n');
    
    paragraphs.forEach((paragraph, index) => {
      if (paragraph.trim()) {
        // Check if this is a heading (ALL CAPS or starts with Roman numerals)
        if (paragraph === paragraph.toUpperCase() || /^(I{1,3}V?|VI{0,3}|I?X)\./. test(paragraph.trim())) {
          doc.font('Helvetica-Bold');
        } else {
          doc.font('Helvetica');
        }
        
        doc.text(paragraph.trim(), {
          align: 'left',
          indent: 0,
          lineGap: 3
        });
        
        doc.moveDown(1);
      }
    });

    // Footer with date and signature line
    doc.moveDown(3);
    doc.text('Respectfully submitted,', { align: 'left' });
    doc.moveDown(3);
    doc.text('_________________________________', { align: 'left' });
    doc.text(data.plaintiffName, { align: 'left' });
    doc.text(data.plaintiffAddress, { align: 'left' });
    doc.moveDown(1);
    doc.text(`Dated: ${new Date().toLocaleDateString()}`, { align: 'left' });

    doc.end();
  });
}

export async function generateCoverSheetPDF(data: CoverSheetPDFData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'LETTER',
      margins: {
        top: 72,
        bottom: 72,
        left: 72,
        right: 72
      }
    });

    const buffers: Buffer[] = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      resolve(pdfData);
    });
    doc.on('error', reject);

    // Title
    doc.fontSize(16).font('Helvetica-Bold');
    doc.text('CIVIL COVER SHEET', { align: 'center' });
    doc.moveDown(2);

    // Court information
    doc.fontSize(12).font('Helvetica-Bold');
    doc.text('COURT INFORMATION', { underline: true });
    doc.moveDown(0.5);
    
    doc.fontSize(11).font('Helvetica');
    doc.text(`State: ${data.state}`);
    doc.text(`County: ${data.county}`);
    doc.text(`Filing Date: ${data.filingDate}`);
    doc.moveDown(1.5);

    // Plaintiff information
    doc.fontSize(12).font('Helvetica-Bold');
    doc.text('PLAINTIFF INFORMATION', { underline: true });
    doc.moveDown(0.5);
    
    doc.fontSize(11).font('Helvetica');
    doc.text(`Name: ${data.plaintiffName}`);
    doc.text(`Address: ${data.plaintiffAddress}`);
    if (data.plaintiffPhone) {
      doc.text(`Phone: ${data.plaintiffPhone}`);
    }
    if (data.plaintiffEmail) {
      doc.text(`Email: ${data.plaintiffEmail}`);
    }
    doc.moveDown(1.5);

    // Defendant information
    doc.fontSize(12).font('Helvetica-Bold');
    doc.text('DEFENDANT INFORMATION', { underline: true });
    doc.moveDown(0.5);
    
    doc.fontSize(11).font('Helvetica');
    doc.text(`Name: ${data.defendantName}`);
    doc.moveDown(1.5);

    // Case information
    doc.fontSize(12).font('Helvetica-Bold');
    doc.text('CASE INFORMATION', { underline: true });
    doc.moveDown(0.5);
    
    doc.fontSize(11).font('Helvetica');
    doc.text(`Case Type: ${data.caseType}`);
    doc.text(`Nature of Suit: Civil Rights - 42 U.S.C. § 1983`);
    doc.text(`Jurisdiction: Federal Question (28 U.S.C. § 1331, § 1343)`);
    doc.moveDown(1);
    
    // Damages
    if (data.damagesRequested > 0) {
      const damagesAmount = (data.damagesRequested / 100).toFixed(2);
      doc.text(`Damages Sought: $${damagesAmount}`);
    } else {
      doc.text('Damages Sought: To be determined');
    }
    
    doc.moveDown(2);

    // Certification
    doc.fontSize(10).font('Helvetica');
    doc.text('I certify that the information provided in this cover sheet is complete and accurate to the best of my knowledge.', {
      align: 'left'
    });
    
    doc.moveDown(3);
    doc.text('_________________________________', { align: 'left' });
    doc.text('Plaintiff Signature', { align: 'left' });
    doc.moveDown(1);
    doc.text(`Date: ${data.filingDate}`, { align: 'left' });

    doc.end();
  });
}

export async function generateJS44CoverSheet(data: CoverSheetPDFData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'LETTER',
      margins: {
        top: 50,
        bottom: 50,
        left: 50,
        right: 50
      }
    });

    const buffers: Buffer[] = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      resolve(pdfData);
    });
    doc.on('error', reject);

    // Header - Form JS-44
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('JS 44   (Rev. 10/20)', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(12);
    doc.text('CIVIL COVER SHEET', { align: 'center' });
    doc.moveDown(1);

    // Instructions
    doc.fontSize(8).font('Helvetica');
    doc.text('The JS 44 civil cover sheet and the information contained herein neither replace nor supplement the filing and service of pleadings or other papers as required by law, except as provided by local rules of court. This form, approved by the Judicial Conference of the United States in September 1974, is required for the use of the Clerk of Court for the purpose of initiating the civil docket sheet.', {
      align: 'justify',
      lineGap: 2
    });
    doc.moveDown(1);

    // I. PLAINTIFFS and DEFENDANTS
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('I.   (a) PLAINTIFFS', { continued: true });
    doc.text('                                                    DEFENDANTS', { align: 'right' });
    doc.moveDown(0.3);
    doc.fontSize(9).font('Helvetica');
    doc.text(data.plaintiffName, { continued: true, width: 250 });
    doc.text(data.defendantName, { align: 'right' });
    doc.moveDown(1);

    // (b) County of Residence
    doc.fontSize(9).font('Helvetica');
    doc.text(`     (b) County of Residence of First Listed Plaintiff ${data.county}`, { continued: true, width: 250 });
    doc.text('County of Residence of First Listed Defendant', { align: 'right' });
    doc.fontSize(8);
    doc.text('(EXCEPT IN U.S. PLAINTIFF CASES)', { continued: true, width: 250 });
    doc.text('(IN U.S. PLAINTIFF CASES ONLY)', { align: 'right' });
    doc.moveDown(0.5);

    // (c) Attorneys
    doc.fontSize(8);
    doc.text('     (c) Attorneys (Firm Name, Address, and Telephone Number)', { continued: true, width: 250 });
    doc.text('Attorneys (If Known)', { align: 'right' });
    doc.fontSize(9);
    doc.text(`${data.plaintiffName}`, { continued: true, width: 250 });
    doc.text('', { align: 'right' });
    doc.text(`${data.plaintiffAddress}`, { continued: true, width: 250 });
    doc.text('', { align: 'right' });
    if (data.plaintiffPhone) {
      doc.text(`Tel: ${data.plaintiffPhone}`, { continued: true, width: 250 });
      doc.text('', { align: 'right' });
    }
    if (data.plaintiffEmail) {
      doc.text(`Email: ${data.plaintiffEmail}`, { continued: true, width: 250 });
      doc.text('', { align: 'right' });
    }
    doc.moveDown(1);

    // II. BASIS OF JURISDICTION
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('II.  BASIS OF JURISDICTION (Place an "X" in One Box Only)');
    doc.moveDown(0.3);
    doc.fontSize(9).font('Helvetica');
    doc.text('☐ 1   U.S. Government Plaintiff          ☒ 3   Federal Question');
    doc.text('☐ 2   U.S. Government Defendant          ☐ 4   Diversity');
    doc.text('                                              (Indicate Citizenship of Parties in Item III)');
    doc.moveDown(1);

    // III. CITIZENSHIP OF PRINCIPAL PARTIES
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('III.  CITIZENSHIP OF PRINCIPAL PARTIES (Place an "X" in One Box for Plaintiff and One Box for Defendant)');
    doc.fontSize(8).font('Helvetica');
    doc.text('(For Diversity Cases Only)                                          PTF    DEF                                                       PTF    DEF');
    doc.fontSize(9);
    doc.text('Citizen of This State                      ☐ 1     ☐ 1      Incorporated or Principal Place               ☐ 4     ☐ 4');
    doc.text('                                                            of Business In This State');
    doc.text('Citizen of Another State                   ☐ 2     ☐ 2      Incorporated and Principal Place              ☐ 5     ☐ 5');
    doc.text('                                                            of Business In Another State');
    doc.text('Citizen or Subject of a                    ☐ 3     ☐ 3      Foreign Nation                                ☐ 6     ☐ 6');
    doc.text('Foreign Country');
    doc.moveDown(1);

    // IV. NATURE OF SUIT
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('IV.  NATURE OF SUIT (Place an "X" in One Box Only)');
    doc.moveDown(0.3);
    doc.fontSize(8).font('Helvetica');
    
    // Civil Rights section - check 440 (Civil Rights - Other)
    doc.text('                    CIVIL RIGHTS                                      PRISONER PETITIONS');
    doc.text('☐ 440 Other Civil Rights                      ☐ 510 Motions to Vacate Sentence');
    doc.text('☒ 441 Voting                                  ☐ 530 General');
    doc.text('☐ 442 Employment                              ☐ 535 Death Penalty');
    doc.text('☐ 443 Housing/                                ☐ 540 Mandamus & Other');
    doc.text('      Accommodations                          ☐ 550 Civil Rights');
    doc.text('☐ 445 Amer. w/Disabilities -                  ☐ 555 Prison Condition');
    doc.text('      Employment                              ☐ 560 Civil Detainee -');
    doc.text('☐ 446 Amer. w/Disabilities -                        Conditions of');
    doc.text('      Other                                         Confinement');
    doc.text('☐ 448 Education');
    doc.moveDown(1);

    // V. ORIGIN
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('V.   ORIGIN (Place an "X" in One Box Only)');
    doc.moveDown(0.3);
    doc.fontSize(9).font('Helvetica');
    doc.text('☒ 1 Original      ☐ 2 Removed from      ☐ 3 Remanded from      ☐ 4 Reinstated or      ☐ 5 Transferred from      ☐ 6 Multidistrict      ☐ 8 Multidistrict');
    doc.text('  Proceeding        State Court            Appellate Court        Reopened             Another District          Litigation -            Litigation -');
    doc.text('                                                                                        (specify)                Transfer               Direct File');
    doc.moveDown(1);

    // VI. CAUSE OF ACTION
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('VI.  CAUSE OF ACTION');
    doc.moveDown(0.3);
    doc.fontSize(9).font('Helvetica');
    doc.text('Cite the U.S. Civil Statute under which you are filing (Do not cite jurisdictional statutes unless diversity):');
    doc.text('42 U.S.C. § 1983 - Civil Rights Act');
    doc.moveDown(0.5);
    doc.text(`Brief description of cause: ${data.caseType}`);
    doc.moveDown(1);

    // VII. REQUESTED IN COMPLAINT
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('VII. REQUESTED IN COMPLAINT:');
    doc.moveDown(0.3);
    doc.fontSize(9).font('Helvetica');
    doc.text('☐ CHECK IF THIS IS A CLASS ACTION       DEMAND $', { continued: true });
    if (data.damagesRequested > 0) {
      doc.text((data.damagesRequested / 100).toFixed(2));
    } else {
      doc.text('________________');
    }
    doc.text('UNDER RULE 23, F.R.Cv.P.                 CHECK YES only if demanded in complaint:');
    doc.text('                                         JURY DEMAND:     ☒ Yes   ☐ No');
    doc.moveDown(1);

    // VIII. RELATED CASE(S)
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('VIII. RELATED CASE(S) IF ANY');
    doc.moveDown(0.3);
    doc.fontSize(9).font('Helvetica');
    doc.text('(See instructions):');
    doc.text('JUDGE ________________________________    DOCKET NUMBER ________________________________');
    doc.moveDown(2);

    // DATE AND SIGNATURE
    doc.fontSize(9).font('Helvetica');
    doc.text(`DATE: ${data.filingDate}`, { continued: true });
    doc.text('SIGNATURE OF ATTORNEY OF RECORD: _________________________________', { align: 'right' });
    doc.moveDown(0.5);
    doc.fontSize(8);
    doc.text('FOR OFFICE USE ONLY');
    doc.text('RECEIPT #             AMOUNT                APPLYING IFP             JUDGE             MAG. JUDGE');

    doc.end();
  });
}

export function convertPDFBufferToBase64(buffer: Buffer): string {
  return buffer.toString('base64');
}
