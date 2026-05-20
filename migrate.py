#!/usr/bin/env python3
"""
ATS Historical Data Migration Script
Extracts hired candidates from both Excel trackers and outputs historical_data.json

File 1: NOT_IN_USE__Onboarding_Tracker_POC_v2.xlsx
  Sheets: New Hires (header row 6), Jan - Jun 2025 (header row 6), Dec 2024 (header row 6),
          May 2021 - Dec 2021 (no header), Sep2020 - Apr2021 (no header)

File 2: 2026_Onboarding_Tracker.xlsx
  Sheet: New Hires (header row 17)

Include rule: POD date/flag set OR is a rehire
Deduplication: payrollId (prefer newer data), then name+phone for old records
"""

import openpyxl
import json
import re
import os
import sys
from datetime import datetime

FILE1 = '/root/.claude/uploads/787088a4-1f59-462f-a750-85899d83cd93/b2f93bad-NOT_IN_USE__Onboarding_Tracker_POC_v2.xlsx'
FILE2 = '/root/.claude/uploads/787088a4-1f59-462f-a750-85899d83cd93/09f4e5c7-2026_Onboarding_Tracker.xlsx'
OUTPUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'historical_data.json')


def fmt_date(val):
    if val is None:
        return None
    if isinstance(val, datetime):
        return val.strftime('%Y-%m-%d')
    s = str(val).strip()
    if not s or s.lower() in ('none', 'ghost', 'n/a', '-'):
        return None
    # Try common formats
    for fmt in ('%Y-%m-%d %H:%M:%S', '%Y-%m-%d', '%m/%d/%Y', '%d/%m/%Y'):
        try:
            return datetime.strptime(s, fmt).strftime('%Y-%m-%d')
        except ValueError:
            pass
    return None


def fmt_phone(val):
    if val is None:
        return ''
    if isinstance(val, float):
        val = str(int(val))
    s = re.sub(r'[^\d+]', '', str(val))
    if len(s) == 10:
        return f'({s[:3]}) {s[3:6]}-{s[6:]}'
    if len(s) == 11 and s[0] == '1':
        return f'({s[1:4]}) {s[4:7]}-{s[7:]}'
    return str(val).strip()


def fmt_payroll(val):
    if val is None:
        return ''
    if isinstance(val, float):
        return str(int(val))
    return str(val).strip()


def split_name(full_name):
    if not full_name:
        return '', ''
    parts = str(full_name).strip().split()
    if len(parts) == 0:
        return '', ''
    if len(parts) == 1:
        return parts[0], ''
    return parts[0], ' '.join(parts[1:])


def parse_lang_rehire(val):
    if val is None:
        return 'EN', False
    s = str(val).lower().strip()
    is_fr = 'french' in s or 'fr' in s
    is_rehire = 'rehire' in s or 'returning' in s or 'transfer' in s
    lang = 'FR' if is_fr else 'EN'
    return lang, is_rehire


def make_id(idx, source_tag):
    ts = int(datetime(2020, 1, 1).timestamp() * 1000) + idx * 13
    return f'hist_{source_tag}_{ts}_{idx}'


def make_candidate(first, last, phone, email, office, lang, is_rehire, payroll,
                   adp_sent, charity, manager, day0, pod_date, missing_docs_str,
                   adp_complete, hsf_needed, hsf_it, pod_bool, notes, idx, tag):
    phone_fmt = fmt_phone(phone)
    payroll_fmt = fmt_payroll(payroll)

    pod_activated = False
    pod_at = None
    if pod_date:
        pod_activated = True
        pod_at = pod_date
    elif pod_bool is True:
        pod_activated = True

    adp_sent_flag = bool(adp_sent)
    adp_sent_at = adp_sent if adp_sent else None
    adp_complete_flag = bool(adp_complete)
    adp_complete_at = adp_complete if adp_complete else None

    # Missing docs parsing (e.g. "DD", "ID, DD", "WP")
    md = {'directDeposit': False, 'sin': False, 'govId': False, 'contract': False, 'workPermit': False}
    if missing_docs_str and str(missing_docs_str).strip() not in ('', 'None'):
        mds = str(missing_docs_str).upper()
        if 'DD' in mds:
            md['directDeposit'] = True
        if 'SIN' in mds or 'NAS' in mds:
            md['sin'] = True
        if 'ID' in mds or 'GOV' in mds:
            md['govId'] = True
        if 'CONTRACT' in mds or 'CON' in mds:
            md['contract'] = True
        if 'WP' in mds or 'WORK PERMIT' in mds or 'PERMIT' in mds:
            md['workPermit'] = True

    # Determine created_at from earliest date available
    dates = [d for d in [adp_sent_at, day0, pod_at] if d]
    created_at = min(dates) + 'T00:00:00.000Z' if dates else '2020-01-01T00:00:00.000Z'

    # For historical records, assume user was created (they completed onboarding)
    user_created = pod_activated or adp_complete_flag or adp_sent_flag

    return {
        'firstName': first,
        'lastName': last,
        'preferredName': '',
        'phone': phone_fmt,
        'email': email or '',
        'languagePreference': lang,
        'isRehire': is_rehire,
        'payrollId': payroll_fmt,
        'officeCode': str(office).strip() if office else '',
        'charity': str(charity).strip() if charity else '',
        'availability': '',
        'day0': day0 or '',
        'source': 'Historical Import',
        'interviewDate': '',
        'interviewer': '',
        'status': 'Hired',
        'notes': str(notes).strip() if notes and str(notes).strip() not in ('None', '') else '',
        'username': '',
        'password': '',
        'manager': str(manager).strip() if manager else '',
        'region': '',
        'onboarding': {
            'userCreated': user_created,
            'userCreatedAt': created_at if user_created else None,
            'adpSent': adp_sent_flag,
            'adpSentAt': adp_sent_at + 'T00:00:00.000Z' if adp_sent_at else None,
            'adpComplete': adp_complete_flag,
            'adpCompleteAt': adp_complete_at + 'T00:00:00.000Z' if adp_complete_at else None,
            'podActivated': pod_activated,
            'podActivatedAt': pod_at + 'T00:00:00.000Z' if pod_at else None,
            'missingDocs': md,
            'missingDocsEmailSent': False,
            'hsfAccountNeeded': bool(hsf_needed),
            'hsfItRequestSent': bool(hsf_it),
        },
        'createdAt': created_at,
        'hiredAt': created_at,
        'isHistorical': True,
        'isDNH': False,
        '_sourceTag': tag,
        '_idx': idx,
    }


def extract_file1_newhires(wb):
    """File 1 'New Hires' sheet — header row index 5, data from index 6"""
    sheet = wb['New Hires']
    rows = list(sheet.iter_rows(values_only=True))
    records = []
    for i, row in enumerate(rows[6:], start=0):
        pod = fmt_date(row[3])
        office = row[4]
        name = row[5]
        phone = row[6]
        email = row[7]
        lang_rehire_raw = row[8]
        payroll = row[9]
        adp_sent = fmt_date(row[10])
        charity = row[11]
        manager = row[13]
        day0 = fmt_date(row[14])

        if not name or str(name).strip() == '':
            continue

        lang, is_rehire = parse_lang_rehire(lang_rehire_raw)

        has_pod = pod and pod not in ('Ghost', 'ghost')
        if not has_pod and not is_rehire:
            continue

        first, last = split_name(name)
        rec = make_candidate(first, last, phone, email, office, lang, is_rehire,
                             payroll, adp_sent, charity, manager, day0, pod,
                             None, None, None, None, None, None, i, 'f1_nh')
        records.append(rec)

    print(f"  File1 New Hires: {len(records)} records extracted")
    return records


def extract_file1_janjun2025(wb):
    """File 1 'Jan - Jun 2025' — header row index 5, data from index 6
    Col 2: POD, 3: Office, 4: Name, 5: Phone, 6: Email, 7: Lang/Rehire,
    8: PayrollID, 9: ADP Sent, 10: Charity, 11: Manager, 12: Day0, 14: Missing Docs"""
    sheet = wb['Jan - Jun 2025']
    rows = list(sheet.iter_rows(values_only=True))
    records = []
    for i, row in enumerate(rows[6:], start=0):
        pod = fmt_date(row[2])
        office = row[3]
        name = row[4]
        phone = row[5]
        email = row[6]
        lang_rehire_raw = row[7]
        payroll = row[8]
        adp_sent = fmt_date(row[9])
        charity = row[10]
        manager = row[11]
        day0 = fmt_date(row[12])
        missing_docs = row[14] if len(row) > 14 else None

        if not name or str(name).strip() == '':
            continue

        lang, is_rehire = parse_lang_rehire(lang_rehire_raw)
        has_pod = bool(pod)
        if not has_pod and not is_rehire:
            continue

        first, last = split_name(name)
        rec = make_candidate(first, last, phone, email, office, lang, is_rehire,
                             payroll, adp_sent, charity, manager, day0, pod,
                             missing_docs, None, None, None, None, None, i, 'f1_jj25')
        records.append(rec)

    print(f"  File1 Jan-Jun 2025: {len(records)} records extracted")
    return records


def extract_file1_dec2024(wb):
    """File 1 'Dec 2024' — same layout as Jan-Jun 2025, header row index 5, data from index 6"""
    sheet = wb['Dec 2024']
    rows = list(sheet.iter_rows(values_only=True))
    records = []
    for i, row in enumerate(rows[6:], start=0):
        pod = fmt_date(row[2])
        office = row[3]
        name = row[4]
        phone = row[5]
        email = row[6]
        lang_rehire_raw = row[7]
        payroll = row[8]
        adp_sent = fmt_date(row[9])
        charity = row[10]
        manager = row[11]
        day0 = fmt_date(row[12])
        missing_docs = row[14] if len(row) > 14 else None

        if not name or str(name).strip() == '':
            continue

        lang, is_rehire = parse_lang_rehire(lang_rehire_raw)
        has_pod = bool(pod)
        if not has_pod and not is_rehire:
            continue

        first, last = split_name(name)
        rec = make_candidate(first, last, phone, email, office, lang, is_rehire,
                             payroll, adp_sent, charity, manager, day0, pod,
                             missing_docs, None, None, None, None, None, i, 'f1_d24')
        records.append(rec)

    print(f"  File1 Dec 2024: {len(records)} records extracted")
    return records


def extract_file1_may2021dec2021(wb):
    """File 1 'May 2021 - Dec 2021' — no header, data from row 0
    Col 2: POD, 4: Email, 6: Name, 7: Phone, 8: Lang/Rehire, 9: Office"""
    sheet = wb['May 2021 - Dec 2021']
    rows = list(sheet.iter_rows(values_only=True))
    records = []
    for i, row in enumerate(rows, start=0):
        pod = fmt_date(row[2])
        email = row[4]
        name = row[6]
        phone = row[7]
        lang_rehire_raw = row[8]
        office = row[9]

        if not name or str(name).strip() == '':
            continue

        lang, is_rehire = parse_lang_rehire(lang_rehire_raw)
        has_pod = bool(pod)
        if not has_pod and not is_rehire:
            continue

        first, last = split_name(name)
        rec = make_candidate(first, last, phone, email, office, lang, is_rehire,
                             None, None, None, None, None, pod,
                             None, None, None, None, None, None, i, 'f1_m2021')
        records.append(rec)

    print(f"  File1 May2021-Dec2021: {len(records)} records extracted")
    return records


def extract_file1_sep2020apr2021(wb):
    """File 1 'Sep2020 - Apr2021' — no header, data from row 0
    Col 2: POD, 5: Name, 6: Phone, 8: Office"""
    sheet = wb['Sep2020 - Apr2021']
    rows = list(sheet.iter_rows(values_only=True))
    records = []
    for i, row in enumerate(rows, start=0):
        pod = fmt_date(row[2])
        name = row[5]
        phone = row[6]
        office = row[8]

        if not name or str(name).strip() == '':
            continue

        # These are all completed (all have POD dates), so include all
        has_pod = bool(pod)
        if not has_pod:
            continue

        first, last = split_name(name)
        rec = make_candidate(first, last, phone, None, office, 'EN', False,
                             None, None, None, None, None, pod,
                             None, None, None, None, None, None, i, 'f1_s2020')
        records.append(rec)

    print(f"  File1 Sep2020-Apr2021: {len(records)} records extracted")
    return records


def extract_file2_newhires(wb):
    """File 2 'New Hires' — header row index 16, data from index 17
    Col 0: French?, 1: Preferred Name, 2: Full Legal Name, 3: Phone, 4: Email,
    5: Office, 6: Returning Employee, 7: Payroll ID, 8: Day0, 9: Charity,
    10: Manager, 11: ADP Sent, 12: Missing Docs, 13: ADP Complete,
    14: HSF needed, 15: HSF IT sent, 16: POD activated (bool), 17: Notes"""
    sheet = wb['New Hires']
    rows = list(sheet.iter_rows(values_only=True))
    records = []
    for i, row in enumerate(rows[17:], start=0):
        is_french = row[0]
        preferred = row[1]
        name = row[2]
        phone = row[3]
        email = row[4]
        office = row[5]
        rehire_raw = row[6]
        payroll = row[7]
        day0 = fmt_date(row[8])
        charity = row[9]
        manager = row[10]
        adp_sent = fmt_date(row[11])
        missing_docs = row[12]
        adp_complete = fmt_date(row[13])
        hsf_needed = row[14]
        hsf_it = row[15]
        pod_bool = row[16]
        notes = row[17] if len(row) > 17 else None

        if not name or str(name).strip() == '':
            continue

        lang = 'FR' if is_french else 'EN'
        _, is_rehire = parse_lang_rehire(rehire_raw)
        # For File 2 — include all (all are hired candidates in the 2026 tracker)

        first, last = split_name(name)
        preferred_str = str(preferred).strip() if preferred and str(preferred).strip() not in ('None', '') else ''

        rec = make_candidate(first, last, phone, email, office, lang, is_rehire,
                             payroll, adp_sent, charity, manager, day0, None,
                             missing_docs, adp_complete, hsf_needed, hsf_it, pod_bool, notes, i, 'f2_2026')
        rec['preferredName'] = preferred_str
        records.append(rec)

    print(f"  File2 2026 New Hires: {len(records)} records extracted")
    return records


def deduplicate(all_records):
    """
    Deduplicate by payrollId (prefer File 2 > Dec 2024/Jan-Jun 2025 > New Hires > older).
    For records without payrollId, deduplicate by normalized name+phone.
    Source priority: f2_2026 > f1_d24 > f1_jj25 > f1_nh > f1_m2021 > f1_s2020
    """
    priority = {'f2_2026': 0, 'f1_d24': 1, 'f1_jj25': 2, 'f1_nh': 3, 'f1_m2021': 4, 'f1_s2020': 5}

    # Sort by priority so lower priority number = kept on collision
    all_records.sort(key=lambda r: priority.get(r.get('_sourceTag', 'f1_s2020'), 9))

    by_payroll = {}
    by_namephone = {}
    deduped = []

    for rec in all_records:
        pid = rec.get('payrollId', '').strip()
        name_key = (rec.get('firstName', '').lower() + rec.get('lastName', '').lower()).replace(' ', '')
        phone_key = re.sub(r'\D', '', rec.get('phone', ''))
        np_key = f'{name_key}|{phone_key[:7]}' if phone_key else None

        if pid:
            if pid not in by_payroll:
                by_payroll[pid] = True
                deduped.append(rec)
        else:
            if np_key and np_key in by_namephone:
                continue
            if np_key:
                by_namephone[np_key] = True
            deduped.append(rec)

    return deduped


def assign_ids(records):
    """Assign unique IDs and clean up internal fields"""
    result = []
    base_ts = 1577836800000  # 2020-01-01 UTC ms
    for i, rec in enumerate(records):
        clean = dict(rec)
        clean['id'] = f'hist_{base_ts + i * 17}_{i}'
        clean.pop('_sourceTag', None)
        clean.pop('_idx', None)
        result.append(clean)
    return result


def main():
    print('Loading Excel files...')
    wb1 = openpyxl.load_workbook(FILE1, read_only=True, data_only=True)
    wb2 = openpyxl.load_workbook(FILE2, read_only=True, data_only=True)

    print('\nExtracting records...')
    all_records = []

    # File 1 — oldest to newest
    all_records += extract_file1_sep2020apr2021(wb1)
    all_records += extract_file1_may2021dec2021(wb1)
    all_records += extract_file1_newhires(wb1)
    all_records += extract_file1_dec2024(wb1)
    all_records += extract_file1_janjun2025(wb1)

    # File 2 — most recent/authoritative
    all_records += extract_file2_newhires(wb2)

    print(f'\nTotal before deduplication: {len(all_records)}')

    deduped = deduplicate(all_records)
    print(f'After deduplication: {len(deduped)}')

    final = assign_ids(deduped)

    # Stats
    file2_count = sum(1 for r in all_records if r.get('_sourceTag') == 'f2_2026')
    pod_done = sum(1 for r in final if r['onboarding']['podActivated'])
    rehires = sum(1 for r in final if r['isRehire'])
    fr_count = sum(1 for r in final if r['languagePreference'] == 'FR')

    print(f'\nFinal stats:')
    print(f'  Total records: {len(final)}')
    print(f'  POD completed: {pod_done}')
    print(f'  Rehires: {rehires}')
    print(f'  French candidates: {fr_count}')

    with open(OUTPUT, 'w', encoding='utf-8') as f:
        json.dump(final, f, ensure_ascii=False, indent=2)

    print(f'\nOutput written to: {OUTPUT}')
    print('Done!')


if __name__ == '__main__':
    main()
