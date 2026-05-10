#!/usr/bin/env python3
"""
yieldcartography.com — site build script.

Reads CSV inputs from the local YIELDS folder and writes the dashboard JSON
to dist/data/yields.json. The HTML files in dist/curves/ and dist/term-premia/
fetch this JSON at page-load via /data/yields.json.

Usage:
    python build.py
"""
import pandas as pd
import numpy as np
import json
from pathlib import Path

YIELDS_DIR = Path('/Users/marcinhdec/Library/Mobile Documents/com~apple~CloudDocs/YIELDS')
SITE_DIR   = Path(__file__).parent
DIST       = SITE_DIR / 'dist'
DATA_DIR   = DIST / 'data'

NSS_TENORS = [0.5, 1, 2, 3, 5, 7, 10]
SNAP_TENORS = [2, 5, 10]
FWD_HORIZONS_Y = list(range(1, 11))   # 1y, 2y, ..., 10y forward windows


def nss_y(tau, b0, b1, b2, b3, t1, t2):
    h1 = (1 - np.exp(-tau / t1)) / (tau / t1)
    h2 = h1 - np.exp(-tau / t1)
    h3 = (1 - np.exp(-tau / t2)) / (tau / t2) - np.exp(-tau / t2)
    return b0 + b1 * h1 + b2 * h2 + b3 * h3


def nss_zero_pct(tau, row):
    return nss_y(tau, row.beta0, row.beta1, row.beta2, row.beta3, row.tau1, row.tau2) * 100


def nss_disc(tau, row):
    return np.exp(-(nss_y(tau, row.beta0, row.beta1, row.beta2, row.beta3, row.tau1, row.tau2)) * tau)


def fwd_1y(row, t_start):
    """1-year forward starting at t_start, in percent (continuously-compounded conversion)."""
    z1 = nss_y(t_start,     row.beta0, row.beta1, row.beta2, row.beta3, row.tau1, row.tau2)
    z2 = nss_y(t_start + 1, row.beta0, row.beta1, row.beta2, row.beta3, row.tau1, row.tau2)
    f = (z2 * (t_start + 1) - z1 * t_start) / 1.0
    return f * 100


def safe_list(s):
    return [None if pd.isna(x) else float(x) for x in s]


# ---------- load inputs ---------- #

def _try_read(path, **kw):
    p = YIELDS_DIR / path
    if not p.exists():
        print(f'  WARN: {path} not found, skipping')
        return None
    return pd.read_csv(p, **kw)


def build():
    nss = pd.read_csv(YIELDS_DIR / 'nss_params_history.csv', parse_dates=['tradedate'])
    acm = pd.read_csv(YIELDS_DIR / 'acm_term_premia_history.csv', parse_dates=['tradedate'])
    brw = pd.read_csv(YIELDS_DIR / 'acm_term_premia_brw_history.csv', parse_dates=['tradedate'])

    eh_pl = _try_read('eh_panel_zero.csv', parse_dates=['date'])
    eh_us = _try_read('gsw_us.csv',         parse_dates=['date'])
    eh_ea = _try_read('ecb_ea.csv',         parse_dates=['date'])
    fwd   = _try_read('eh_panel_forward.csv', parse_dates=['date'])
    spf   = _try_read('prof_forecasters_implied.csv', parse_dates=['fcast_date'])
    bond  = _try_read('liquidity_bond_day_full.csv', parse_dates=['date'])

    # ---- NSS-derived zero rates on standard tenors ----
    for tau in NSS_TENORS:
        nss[f'y{tau}'] = nss.apply(lambda r: nss_zero_pct(tau, r), axis=1)

    # ---- weekly time series (Friday close) ----
    nss['week'] = nss.tradedate.dt.to_period('W-FRI')
    nss_w = nss.sort_values('tradedate').groupby('week').last().reset_index(drop=True)
    acm_w = acm.set_index('tradedate').reindex(nss_w['tradedate']).reset_index()
    brw_w = brw.set_index('tradedate').reindex(nss_w['tradedate']).reset_index()

    ts = {
        'dates': nss_w['tradedate'].dt.strftime('%Y-%m-%d').tolist(),
        'y2': safe_list(nss_w['y2']), 'y5': safe_list(nss_w['y5']), 'y10': safe_list(nss_w['y10']),
        'tp10_acm_bp': safe_list(acm_w['tp_10y_bp']), 'tp10_brw_bp': safe_list(brw_w['tp_bc_10y_bp']),
        'tp5_acm_bp':  safe_list(acm_w['tp_5y_bp']),  'tp5_brw_bp':  safe_list(brw_w['tp_bc_5y_bp']),
        'tp2_acm_bp':  safe_list(acm_w['tp_2y_bp']),  'tp2_brw_bp':  safe_list(brw_w['tp_bc_2y_bp']),
        'tp1_acm_bp':  safe_list(acm_w['tp_1y_bp']),  'tp1_brw_bp':  safe_list(brw_w['tp_bc_1y_bp']),
        'rf10_acm_pct': safe_list(acm_w['y_rf_10y_pct']), 'rf10_brw_pct': safe_list(brw_w['y_rf_bc_10y_pct']),
        'rf5_acm_pct':  safe_list(acm_w['y_rf_5y_pct']),  'rf5_brw_pct':  safe_list(brw_w['y_rf_bc_5y_pct']),
        'beta0': safe_list(nss_w['beta0'] * 100), 'beta1': safe_list(nss_w['beta1'] * 100),
        'beta2': safe_list(nss_w['beta2'] * 100), 'beta3': safe_list(nss_w['beta3'] * 100),
        'tau1':  safe_list(nss_w['tau1']),        'tau2':  safe_list(nss_w['tau2']),
        'mae_bp': safe_list(nss_w['mae_bp']),     'n_bonds': safe_list(nss_w['n_bonds']),
    }

    # ---- monthly cross-country panel (PL / US / EA) ----
    xc = _build_xcountry(eh_pl, eh_us, eh_ea)

    # ---- monthly snapshots with bond panel, forwards, SPF, x-country ----
    nss['month'] = nss.tradedate.dt.to_period('M')
    month_ends = nss.sort_values('tradedate').groupby('month').last().reset_index(drop=True)

    snaps = []
    for _, r in month_ends.iterrows():
        d = r['tradedate']
        snap = {
            'date': d.strftime('%Y-%m-%d'),
            'beta0': float(r['beta0']), 'beta1': float(r['beta1']),
            'beta2': float(r['beta2']), 'beta3': float(r['beta3']),
            'tau1':  float(r['tau1']),  'tau2':  float(r['tau2']),
            'n_bonds': int(r['n_bonds']), 'mae_bp': float(r['mae_bp']),
            'nbp': float(r['nbp_rate_act365']) * 100 if pd.notna(r.get('nbp_rate_act365')) else None,
        }

        # NSS zeros at standard snapshot tenors
        for tnr in SNAP_TENORS:
            snap[f'pl_{tnr}y'] = float(r[f'y{tnr}'])

        # US / EA zeros aligned to nearest prior month-end
        snap['us_2y'], snap['us_5y'], snap['us_10y'] = _nearest_xc(eh_us, d)
        snap['ea_2y'], snap['ea_5y'], snap['ea_10y'] = _nearest_xc(eh_ea, d)

        # 1y forwards (10 horizons)
        snap['pl_fwds'] = [fwd_1y(r, h - 1) for h in FWD_HORIZONS_Y]

        # SPF most-recent path (next 5 annual readings)
        snap['spf_path'], snap['spf_date'] = _spf_path(spf, d)

        # Bonds in this snapshot day
        snap['bonds'] = _bond_panel(bond, d)

        snaps.append(snap)

    # ---- bond histories for ISINs present in the most-recent snapshot ----
    bond_hist = _bond_hist(bond, snaps[-1]['bonds'] if snaps else [])

    return {
        'meta': {
            'first_date': nss_w['tradedate'].iloc[0].strftime('%Y-%m-%d'),
            'last_date':  nss_w['tradedate'].iloc[-1].strftime('%Y-%m-%d'),
            'n_dates_total':       int(len(nss)),
            'n_dates_weekly':      int(len(nss_w)),
            'n_snapshots_monthly': int(len(month_ends)),
        },
        'ts':         ts,
        'xcountry_m': xc,
        'snaps':      snaps,
        'bond_hist':  bond_hist,
    }


# ---------- helpers ---------- #

def _build_xcountry(eh_pl, eh_us, eh_ea):
    """Monthly x-country zero panel keyed on month-end."""
    out = {'dates': [],
           'pl_2y': [], 'pl_5y': [], 'pl_10y': [], 'pl_spread': [],
           'us_2y': [], 'us_5y': [], 'us_10y': [], 'us_spread': [],
           'ea_2y': [], 'ea_5y': [], 'ea_10y': [], 'ea_spread': []}
    if eh_pl is None or eh_us is None or eh_ea is None:
        return out
    for src in (eh_pl, eh_us, eh_ea):
        src['m'] = src['date'].dt.to_period('M')
    pl_m = eh_pl.sort_values('date').groupby('m').last().reset_index()
    us_m = eh_us.sort_values('date').groupby('m').last().reset_index()
    ea_m = eh_ea.sort_values('date').groupby('m').last().reset_index()
    months = sorted(set(pl_m['m']) & set(us_m['m']) & set(ea_m['m']))
    for m in months:
        out['dates'].append(str(m))
        for tag, df in (('pl', pl_m), ('us', us_m), ('ea', ea_m)):
            row = df[df['m'] == m].iloc[0]
            for col in ('y2', 'y5', 'y10'):
                if col in row and pd.notna(row[col]):
                    out[f'{tag}_{col[1:]}y'].append(float(row[col]))
                else:
                    out[f'{tag}_{col[1:]}y'].append(None)
            y2, y10 = out[f'{tag}_2y'][-1], out[f'{tag}_10y'][-1]
            out[f'{tag}_spread'].append(None if (y2 is None or y10 is None) else y10 - y2)
    return out


def _nearest_xc(df, d):
    if df is None or df.empty:
        return None, None, None
    sub = df[df['date'] <= d]
    if sub.empty:
        return None, None, None
    row = sub.iloc[-1]
    def g(c):
        return float(row[c]) if c in row and pd.notna(row[c]) else None
    return g('y2'), g('y5'), g('y10')


def _spf_path(spf, d):
    if spf is None or spf.empty:
        return None, None
    sub = spf[spf['fcast_date'] <= d].sort_values('fcast_date')
    if sub.empty:
        return None, None
    last_date = sub['fcast_date'].iloc[-1]
    snap = sub[sub['fcast_date'] == last_date].sort_values('horizon_y')
    return [float(v) for v in snap['rate_pct'].tolist()], last_date.strftime('%Y-%m-%d')


def _bond_panel(bond, d):
    if bond is None or bond.empty:
        return []
    sub = bond[bond['date'] == d]
    if sub.empty:
        return []
    rows = []
    for _, b in sub.iterrows():
        rows.append({
            'isin':     str(b.get('ISIN', '')),
            'name':     str(b.get('Nazwa', '')),
            'ttm':      float(b['ttm']) if pd.notna(b.get('ttm')) else None,
            'ytm':      float(b['ytm']) if pd.notna(b.get('ytm')) else None,
            'out':      float(b['outstanding_bn']) if pd.notna(b.get('outstanding_bn')) else None,
            'turnover': float(b['turnover_prev_bn']) if pd.notna(b.get('turnover_prev_bn')) else None,
            'segment':  str(b.get('segment', '')),
        })
    return rows


def _bond_hist(bond, last_panel):
    if bond is None or bond.empty or not last_panel:
        return {}
    isins = [b['isin'] for b in last_panel if b['isin']]
    out = {}
    for isin in isins:
        sub = bond[bond['ISIN'] == isin].copy()
        if sub.empty:
            continue
        sub['week'] = sub['date'].dt.to_period('W-FRI')
        sub_w = sub.sort_values('date').groupby('week').last().reset_index(drop=True)
        sub_w = sub_w.dropna(subset=['ytm', 'ttm'])
        if sub_w.empty:
            continue
        out[isin] = {
            'name':  str(sub_w['Nazwa'].iloc[-1]),
            'dates': sub_w['date'].dt.strftime('%Y-%m-%d').tolist(),
            'ytm':   [float(v) for v in sub_w['ytm']],
            'ttm':   [float(v) for v in sub_w['ttm']],
        }
    return out


def main():
    print('building yieldcartography.com...')
    print('reading data from', YIELDS_DIR)
    data = build()
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    out_path = DATA_DIR / 'yields.json'
    out_path.write_text(json.dumps(data, separators=(',', ':')))
    print(f'  wrote {out_path.relative_to(SITE_DIR)} ({out_path.stat().st_size/1024:.1f} KB)')
    print('done.')


if __name__ == '__main__':
    main()
