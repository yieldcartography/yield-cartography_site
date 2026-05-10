#!/usr/bin/env python3
"""
yieldcartography.com — site build script.

Reads CSV inputs from the local YIELDS folder, regenerates the dashboard JSON,
and re-injects the JSON into the dist/ HTML files.

Usage:
    python build.py
"""
import pandas as pd
import numpy as np
import json
import re
from pathlib import Path

YIELDS_DIR = Path('/Users/marcinhdec/Library/Mobile Documents/com~apple~CloudDocs/YIELDS')
SITE_DIR = Path(__file__).parent
DIST = SITE_DIR / 'dist'

def nss_y(tau, b0, b1, b2, b3, t1, t2):
    h1 = (1 - np.exp(-tau/t1)) / (tau/t1)
    h2 = h1 - np.exp(-tau/t1)
    h3 = (1 - np.exp(-tau/t2)) / (tau/t2) - np.exp(-tau/t2)
    return b0 + b1*h1 + b2*h2 + b3*h3

def safe_list(s):
    return [None if pd.isna(x) else float(x) for x in s]

def build_json():
    nss = pd.read_csv(YIELDS_DIR / 'nss_params_history.csv', parse_dates=['tradedate'])
    acm = pd.read_csv(YIELDS_DIR / 'acm_term_premia_history.csv', parse_dates=['tradedate'])
    brw = pd.read_csv(YIELDS_DIR / 'acm_term_premia_brw_history.csv', parse_dates=['tradedate'])

    for tau in [0.5, 1, 2, 3, 5, 7, 10]:
        nss[f'y{tau}'] = nss.apply(
            lambda r: nss_y(tau, r.beta0, r.beta1, r.beta2, r.beta3, r.tau1, r.tau2),
            axis=1) * 100

    nss['week'] = nss.tradedate.dt.to_period('W-FRI')
    nss_w = nss.groupby('week').last().reset_index(drop=True)
    acm_w = acm.set_index('tradedate').reindex(nss_w['tradedate']).reset_index()
    brw_w = brw.set_index('tradedate').reindex(nss_w['tradedate']).reset_index()

    nss['month'] = nss.tradedate.dt.to_period('M')
    month_ends = nss.groupby('month').last().reset_index(drop=True)
    snaps = []
    for _, r in month_ends.iterrows():
        snaps.append({
            'date': r['tradedate'].strftime('%Y-%m-%d'),
            'beta0': float(r['beta0']), 'beta1': float(r['beta1']),
            'beta2': float(r['beta2']), 'beta3': float(r['beta3']),
            'tau1': float(r['tau1']), 'tau2': float(r['tau2']),
            'n_bonds': int(r['n_bonds']), 'mae_bp': float(r['mae_bp']),
            'nbp': float(r['nbp_rate_act365']) * 100
        })

    return {
        'meta': {
            'first_date': nss_w['tradedate'].iloc[0].strftime('%Y-%m-%d'),
            'last_date': nss_w['tradedate'].iloc[-1].strftime('%Y-%m-%d'),
            'n_dates_total': int(len(nss)),
            'n_dates_weekly': int(len(nss_w)),
            'n_snapshots_monthly': int(len(month_ends))
        },
        'ts': {
            'dates': nss_w['tradedate'].dt.strftime('%Y-%m-%d').tolist(),
            'y2': safe_list(nss_w['y2']), 'y5': safe_list(nss_w['y5']), 'y10': safe_list(nss_w['y10']),
            'tp10_acm_bp': safe_list(acm_w['tp_10y_bp']), 'tp10_brw_bp': safe_list(brw_w['tp_bc_10y_bp']),
            'tp5_acm_bp': safe_list(acm_w['tp_5y_bp']), 'tp5_brw_bp': safe_list(brw_w['tp_bc_5y_bp']),
            'tp2_acm_bp': safe_list(acm_w['tp_2y_bp']), 'tp2_brw_bp': safe_list(brw_w['tp_bc_2y_bp']),
            'tp1_acm_bp': safe_list(acm_w['tp_1y_bp']), 'tp1_brw_bp': safe_list(brw_w['tp_bc_1y_bp']),
            'rf10_acm_pct': safe_list(acm_w['y_rf_10y_pct']), 'rf10_brw_pct': safe_list(brw_w['y_rf_bc_10y_pct']),
            'rf5_acm_pct': safe_list(acm_w['y_rf_5y_pct']), 'rf5_brw_pct': safe_list(brw_w['y_rf_bc_5y_pct']),
            'beta0': safe_list(nss_w['beta0'] * 100), 'beta1': safe_list(nss_w['beta1'] * 100),
            'beta2': safe_list(nss_w['beta2'] * 100), 'beta3': safe_list(nss_w['beta3'] * 100),
            'tau1': safe_list(nss_w['tau1']), 'tau2': safe_list(nss_w['tau2']),
            'mae_bp': safe_list(nss_w['mae_bp']), 'n_bonds': safe_list(nss_w['n_bonds'])
        },
        'snaps': snaps
    }

def inject(html_path, data_str):
    txt = html_path.read_text()
    new = re.sub(r'const DATA = \{.*?\};', f'const DATA = {data_str};', txt, count=1, flags=re.DOTALL)
    html_path.write_text(new)
    print(f'  updated: {html_path.relative_to(SITE_DIR)}')

def main():
    print('building yieldcartography.com...')
    print('reading data from', YIELDS_DIR)
    data = build_json()
    data_str = json.dumps(data, separators=(',', ':'))
    print(f'  generated JSON: {len(data_str)/1024:.1f} KB')

    for page in ['curves/index.html', 'term-premia/index.html']:
        inject(DIST / page, data_str)

    print('done.')

if __name__ == '__main__':
    main()
