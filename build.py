#!/usr/bin/env python3
"""
yieldcartography.com — site build script.

Reads CSV inputs from the local YIELDS folder and writes the dashboard JSON
to dist/data/yields.json. The dashboards in dist/curves/, dist/term-premia/,
dist/liquidity/, and dist/eh-tests/ all fetch this single JSON at page-load
via /data/yields.json.

Usage:
    python build.py
"""
import pandas as pd
import numpy as np
import json
import os
import datetime as dt
from pathlib import Path

YIELDS_DIR = Path('/Users/marcinhdec/Library/Mobile Documents/com~apple~CloudDocs/YIELDS')
SITE_DIR   = Path(__file__).parent
DIST       = SITE_DIR / 'dist'
DATA_DIR   = DIST / 'data'

# Standard tenors used everywhere on the site (matches eh_panel_zero/gsw_us/ecb_ea schema)
TENORS_STD = [0.25, 0.5, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
# Suffixes in the EH zero CSVs
TENOR_COLS = ['y_3m', 'y_6m', 'y_1y', 'y_2y', 'y_3y', 'y_4y', 'y_5y',
              'y_6y', 'y_7y', 'y_8y', 'y_9y', 'y_10y']
TENOR_LABELS = ['3m', '6m', '1y', '2y', '3y', '4y', '5y', '6y', '7y', '8y', '9y', '10y']
SNAP_TENORS_FULL = [0.25, 0.5, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

# 1y forwards: f_0_1, f_1_2, ..., f_9_10
FWD_COLS = [f'f_{i}_{i+1}' for i in range(10)]

# ACM / BRW available rf-yield tenors
ACM_RF_TENORS = [1, 2, 5, 10]
BRW_RF_TENORS = [1, 2, 3, 5, 7, 10]


# ------------------------------ NSS helpers ------------------------------ #

def nss_y(tau, b0, b1, b2, b3, t1, t2):
    h1 = (1 - np.exp(-tau / t1)) / (tau / t1)
    h2 = h1 - np.exp(-tau / t1)
    h3 = (1 - np.exp(-tau / t2)) / (tau / t2) - np.exp(-tau / t2)
    return b0 + b1 * h1 + b2 * h2 + b3 * h3


def nss_zero_pct(tau, row):
    return nss_y(tau, row.beta0, row.beta1, row.beta2, row.beta3, row.tau1, row.tau2) * 100


def fwd_1y(row, t_start):
    """1-year forward starting at t_start, in percent."""
    z1 = nss_y(t_start,     row.beta0, row.beta1, row.beta2, row.beta3, row.tau1, row.tau2)
    z2 = nss_y(t_start + 1, row.beta0, row.beta1, row.beta2, row.beta3, row.tau1, row.tau2)
    f = z2 * (t_start + 1) - z1 * t_start
    return f * 100


def safe_list(s):
    return [None if pd.isna(x) else float(x) for x in s]


def safe_round(s, n=4):
    return [None if pd.isna(x) else round(float(x), n) for x in s]


def _try_read(path, **kw):
    p = YIELDS_DIR / path
    if not p.exists():
        print(f'  WARN: {path} not found, skipping')
        return None
    return pd.read_csv(p, **kw)


# ------------------------------ data builders ------------------------------ #

def build():
    # Core NSS + ACM/BRW
    nss = pd.read_csv(YIELDS_DIR / 'nss_params_history.csv', parse_dates=['tradedate'])
    acm = pd.read_csv(YIELDS_DIR / 'acm_term_premia_history.csv', parse_dates=['tradedate'])
    brw = pd.read_csv(YIELDS_DIR / 'acm_term_premia_brw_history.csv', parse_dates=['tradedate'])

    eh_pl = _try_read('eh_panel_zero.csv',         parse_dates=['date'])
    eh_us = _try_read('gsw_us.csv',                parse_dates=['date'])
    eh_ea = _try_read('ecb_ea.csv',                parse_dates=['date'])
    fwd   = _try_read('eh_panel_forward.csv',      parse_dates=['date'])
    spf   = _try_read('prof_forecasters_implied.csv', parse_dates=['fcast_date'])
    bond  = _try_read('liquidity_bond_day_full.csv',  parse_dates=['date'])

    # Index ACM and BRW by trade date for fast lookup per snapshot
    acm_ix = acm.set_index('tradedate').sort_index()
    brw_ix = brw.set_index('tradedate').sort_index()

    # NSS-derived zero rates on standard tenors (in percent)
    for tau in TENORS_STD:
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

    # ---- monthly cross-country panel (PL / US / EA, full 12 tenors + spreads) ----
    xc = _build_xcountry(eh_pl, eh_us, eh_ea)

    # ---- PCA loadings on PL zero-rate panel: level / slope / curvature ----
    pca = _build_pca(eh_pl)

    # ---- correlation matrix of TPs (ACM 1/2/5/10 + BRW 1/2/5/10) ----
    corr = _build_corr(ts)

    # ---- liquidity panel (monthly aggregates) ----
    liq = _build_liquidity(bond)

    # ---- EH testing panel (FB1, FB2, CP, OOS-STV, pooled) ----
    eh = _build_eh()

    # ---- monthly snapshots (NSS, bond panel, full-tenor x-country, forwards, SPF) ----
    nss['month'] = nss.tradedate.dt.to_period('M')
    month_ends = nss.sort_values('tradedate').groupby('month').last().reset_index(drop=True)

    snaps = []
    last_panel_isins = set()
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

        # NSS zeros at full tenor grid for snapshot
        snap['pl_curve'] = [round(nss_zero_pct(t, r), 4) for t in SNAP_TENORS_FULL]
        snap['pl_tenors'] = SNAP_TENORS_FULL

        # US / EA full-tenor snapshot (nearest prior trading day)
        snap['us_curve'] = _nearest_full(eh_us, d)
        snap['ea_curve'] = _nearest_full(eh_ea, d)

        # Convenience scalars (kept for backward compat with simple charts)
        snap['pl_2y']  = round(nss_zero_pct(2,  r), 4)
        snap['pl_5y']  = round(nss_zero_pct(5,  r), 4)
        snap['pl_10y'] = round(nss_zero_pct(10, r), 4)
        for tag in ('us', 'ea'):
            crv = snap[tag + '_curve']
            snap[f'{tag}_2y']  = crv[3]  if crv else None
            snap[f'{tag}_5y']  = crv[6]  if crv else None
            snap[f'{tag}_10y'] = crv[11] if crv else None

        # Forwards: prefer pre-computed eh_panel_forward.csv if available, fall back to NSS
        snap['pl_fwds'] = _nearest_fwd(fwd, d)
        if snap['pl_fwds'] is None:
            snap['pl_fwds'] = [round(fwd_1y(r, h), 4) for h in range(10)]

        # ACM rf yield curve at integer tenors (expected average short rate over horizon)
        snap['rf_acm'] = _acm_rf(acm_ix, d, ACM_RF_TENORS)
        # BRW rf yield curve (vanilla) and bias-corrected variant
        snap['rf_brw']    = _brw_rf(brw_ix, d, BRW_RF_TENORS, bc=False)
        snap['rf_brw_bc'] = _brw_rf(brw_ix, d, BRW_RF_TENORS, bc=True)
        snap['acm_rf_tenors'] = ACM_RF_TENORS
        snap['brw_rf_tenors'] = BRW_RF_TENORS

        # SPF latest implied path (5 annual readings: y0..y4)
        snap['spf_path'], snap['spf_date'] = _spf_path(spf, d)

        # Bond panel for this snapshot
        snap['bonds'] = _bond_panel(bond, d)
        last_panel_isins.update(b['isin'] for b in snap['bonds'] if b.get('isin'))

        snaps.append(snap)

    # ---- bond histories: cover ALL ISINs that ever appeared in any monthly snap ----
    all_isins = set()
    for s in snaps:
        for b in s.get('bonds', []):
            if b.get('isin'):
                all_isins.add(b['isin'])
    bond_hist = _bond_hist(bond, all_isins)

    return {
        'meta': {
            'first_date': nss_w['tradedate'].iloc[0].strftime('%Y-%m-%d'),
            'last_date':  nss_w['tradedate'].iloc[-1].strftime('%Y-%m-%d'),
            'n_dates_total':       int(len(nss)),
            'n_dates_weekly':      int(len(nss_w)),
            'n_snapshots_monthly': int(len(month_ends)),
            'n_isins_in_history':  int(len(all_isins)),
            'build_ts':            dt.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'),
            'schema_version':      'v5',
        },
        'tenor_labels': TENOR_LABELS,
        'tenor_years':  SNAP_TENORS_FULL,
        'ts':           ts,
        'xcountry_m':   xc,
        'pca':          pca,
        'corr':         corr,
        'liquidity':    liq,
        'eh':           eh,
        'snaps':        snaps,
        'bond_hist':    bond_hist,
    }


# ------------------------------ helpers ------------------------------ #

def _build_xcountry(eh_pl, eh_us, eh_ea):
    """Monthly cross-country zero panel — full 12 tenors per country + level/slope/curve for PL."""
    out = {'dates': []}
    for tag in ('pl', 'us', 'ea'):
        for tnr in TENOR_LABELS:
            out[f'{tag}_{tnr}'] = []
        out[f'{tag}_spread'] = []  # 10y - 2y
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
            for col, lbl in zip(TENOR_COLS, TENOR_LABELS):
                v = float(row[col]) * 100 if col in row and pd.notna(row[col]) else None
                out[f'{tag}_{lbl}'].append(round(v, 4) if v is not None else None)
            y2 = out[f'{tag}_2y'][-1]; y10 = out[f'{tag}_10y'][-1]
            out[f'{tag}_spread'].append(None if (y2 is None or y10 is None) else round(y10 - y2, 4))
    return out


def _build_pca(eh_pl):
    """Time series of level / slope / curvature factors as already computed in eh_panel_zero."""
    if eh_pl is None or 'level' not in eh_pl.columns:
        return None
    df = eh_pl.dropna(subset=['level']).sort_values('date').copy()
    df['m'] = df['date'].dt.to_period('M')
    df_m = df.groupby('m').last().reset_index()
    return {
        'dates':     df_m['date'].dt.strftime('%Y-%m-%d').tolist(),
        'level':     safe_round(df_m['level']),
        'slope':     safe_round(df_m['slope']),
        'curvature': safe_round(df_m['curvature']),
    }


def _build_corr(ts):
    """Correlation matrix of TP series across horizons (ACM + BRW), in percent return space."""
    keys = ['tp1_acm_bp','tp2_acm_bp','tp5_acm_bp','tp10_acm_bp',
            'tp1_brw_bp','tp2_brw_bp','tp5_brw_bp','tp10_brw_bp']
    labels = ['1y ACM','2y ACM','5y ACM','10y ACM','1y BRW','2y BRW','5y BRW','10y BRW']
    df = pd.DataFrame({k: ts[k] for k in keys}).dropna()
    if df.empty:
        return None
    M = df.corr().round(3)
    return {'labels': labels, 'matrix': M.values.tolist()}


def _build_liquidity(bond):
    if bond is None or bond.empty:
        return None
    cols = ['date','ISIN','bas_bp','ztd','amihud','roll','gamma','corwin_schultz','composite_z']
    cols = [c for c in cols if c in bond.columns]
    df = bond[cols].copy()
    df['m'] = df['date'].dt.to_period('M')
    agg = df.groupby('m').agg(
        n_bonds=('ISIN','nunique'),
        bas_bp_med=('bas_bp','median'),
        bas_bp_p25=('bas_bp', lambda s: s.quantile(0.25)),
        bas_bp_p75=('bas_bp', lambda s: s.quantile(0.75)),
        ztd_mean=('ztd','mean'),
        amihud_med=('amihud','median'),
        roll_med=('roll','median'),
        gamma_med=('gamma','median'),
        cs_med=('corwin_schultz','median'),
        composite_z_mean=('composite_z','mean'),
    ).reset_index()
    agg['date'] = agg['m'].astype(str)
    return {
        'dates':            agg['date'].tolist(),
        'n_bonds':          [int(x) for x in agg['n_bonds']],
        'bas_bp_med':       safe_round(agg['bas_bp_med'], 3),
        'bas_bp_p25':       safe_round(agg['bas_bp_p25'], 3),
        'bas_bp_p75':       safe_round(agg['bas_bp_p75'], 3),
        'ztd_pct':          safe_round(agg['ztd_mean'] * 100, 2),
        'amihud_med':       safe_round(agg['amihud_med'], 6),
        'roll_med':         safe_round(agg['roll_med'], 6),
        'gamma_med':        safe_round(agg['gamma_med'], 8),
        'cs_med':           safe_round(agg['cs_med'], 6),
        'composite_z':      safe_round(agg['composite_z_mean'], 3),
    }


def _build_eh():
    """Bundle EH-test outputs into a JSON-friendly structure."""
    out = {}
    # FB1 / FB2 — main results (PL)
    for tag, fn in (('fb1', 'eh_fb1_results.csv'), ('fb2', 'eh_fb2_results.csv')):
        df = _try_read(fn)
        if df is None:
            continue
        out[tag] = df.fillna('').to_dict(orient='list')

    # FB1 / FB2 — heatmaps (h_m vs n_m)
    for tag, fn in (('fb1_heatmap', 'eh_fb1_heatmap.csv'), ('fb2_heatmap', 'eh_fb2_heatmap.csv')):
        df = _try_read(fn)
        if df is None:
            continue
        # First col is index (h_m), other cols are n_m
        df = df.rename(columns={df.columns[0]: 'h_m'})
        out[tag] = {
            'h_m':    df['h_m'].tolist(),
            'n_m':    [int(c) for c in df.columns[1:]],
            'matrix': df.iloc[:, 1:].values.tolist(),
        }

    # CP — second stage (n_y, b_n, etc.)
    cp_main = _try_read('eh_cp_second_stage.csv')
    if cp_main is not None:
        out['cp_second'] = cp_main.fillna('').to_dict(orient='list')

    # CP — multi (single + seagull joint)
    cp_multi = _try_read('eh_cp_multi.csv')
    if cp_multi is not None:
        out['cp_multi'] = cp_multi.fillna('').to_dict(orient='list')

    # OOS-STV (PL, US, EA)
    for tag, fn in (('oos_pl', 'eh_oos_stv_results.csv'),
                    ('oos_us', 'eh_oos_stv_us_results.csv'),
                    ('oos_ea', 'eh_oos_stv_ea_results.csv')):
        df = _try_read(fn)
        if df is None:
            continue
        out[tag] = df.fillna('').to_dict(orient='list')

    # Pooled cross-market FB1
    pooled = _try_read('eh_pooled_results.csv')
    if pooled is not None:
        out['pooled'] = pooled.fillna('').to_dict(orient='list')

    # Macro-spanning regressions
    macro = _try_read('eh_macro_spanning_results.csv')
    if macro is not None:
        out['macro_spanning'] = macro.fillna('').to_dict(orient='list')

    # Descriptive stats
    desc = _try_read('eh_descstat_xmarket.csv')
    if desc is not None:
        out['desc'] = desc.fillna('').to_dict(orient='list')

    # Cross-market FB1 (PL / US / EA)
    for tag, fn in (('fb1_pl', 'eh_fb1_pl_xm.csv'),
                    ('fb1_us', 'eh_fb1_us_xm.csv'),
                    ('fb1_ea', 'eh_fb1_ea_xm.csv')):
        df = _try_read(fn)
        if df is None:
            continue
        out[tag] = df.fillna('').to_dict(orient='list')

    return out


def _nearest_full(df, d):
    if df is None or df.empty:
        return None
    sub = df[df['date'] <= d]
    if sub.empty:
        return None
    row = sub.iloc[-1]
    return [round(float(row[c]) * 100, 4) if c in row and pd.notna(row[c]) else None for c in TENOR_COLS]


def _nearest_fwd(df, d):
    if df is None or df.empty:
        return None
    sub = df[df['date'] <= d]
    if sub.empty:
        return None
    row = sub.iloc[-1]
    return [round(float(row[c]) * 100, 4) if c in row and pd.notna(row[c]) else None for c in FWD_COLS]


def _acm_rf(acm_ix, d, tenors):
    """Pull ACM expected-rate yield curve at the given trade date and tenor list (in percent)."""
    sub = acm_ix.loc[acm_ix.index <= d]
    if sub.empty:
        return None
    row = sub.iloc[-1]
    return [round(float(row[f'y_rf_{t}y_pct']), 4) if f'y_rf_{t}y_pct' in row and pd.notna(row[f'y_rf_{t}y_pct']) else None for t in tenors]


def _brw_rf(brw_ix, d, tenors, bc=False):
    """Pull BRW expected-rate yield curve (vanilla or bias-corrected)."""
    sub = brw_ix.loc[brw_ix.index <= d]
    if sub.empty:
        return None
    row = sub.iloc[-1]
    pre = 'y_rf_bc_' if bc else 'y_rf_'
    return [round(float(row[f'{pre}{t}y_pct']), 4) if f'{pre}{t}y_pct' in row and pd.notna(row[f'{pre}{t}y_pct']) else None for t in tenors]


def _spf_path(spf, d):
    if spf is None or spf.empty:
        return None, None
    sub = spf[spf['fcast_date'] <= d].sort_values('fcast_date')
    if sub.empty:
        return None, None
    row = sub.iloc[-1]
    path = [float(row[c]) if pd.notna(row.get(c)) else None for c in ('y0','y1','y2','y3','y4')]
    return path, row['fcast_date'].strftime('%Y-%m-%d')


def _bond_panel(bond, d):
    if bond is None or bond.empty:
        return []
    sub = bond[bond['date'] == d]
    if sub.empty:
        return []
    rows = []
    for _, b in sub.iterrows():
        out_mln = b.get('outstanding_mln'); turn_mln = b.get('turnover_monthly_mln')
        rows.append({
            'isin':     str(b.get('ISIN', '')),
            'name':     str(b.get('Nazwa', '')),
            'ttm':      float(b['ttm']) if pd.notna(b.get('ttm')) else None,
            'ytm':      float(b['rent_fix_pct']) if pd.notna(b.get('rent_fix_pct')) else None,
            'out':      round(float(out_mln) / 1000.0, 2)  if pd.notna(out_mln)  else None,  # PLN bn
            'turnover': round(float(turn_mln) / 1000.0, 3) if pd.notna(turn_mln) else None,  # PLN bn
            'segment':  str(b.get('segment', '')),
        })
    return rows


def _bond_hist(bond, isins):
    if bond is None or bond.empty or not isins:
        return {}
    out = {}
    for isin in isins:
        sub = bond[bond['ISIN'] == isin].copy()
        if sub.empty:
            continue
        sub['week'] = sub['date'].dt.to_period('W-FRI')
        sub_w = sub.sort_values('date').groupby('week').last().reset_index(drop=True)
        sub_w = sub_w.dropna(subset=['rent_fix_pct', 'ttm'])
        if sub_w.empty:
            continue
        out[isin] = {
            'name':  str(sub_w['Nazwa'].iloc[-1]),
            'dates': sub_w['date'].dt.strftime('%Y-%m-%d').tolist(),
            'ytm':   [round(float(v), 3) for v in sub_w['rent_fix_pct']],
            'ttm':   [round(float(v), 4) for v in sub_w['ttm']],
        }
    return out


# ------------------------------ entry ------------------------------ #

def main():
    print('building yieldcartography.com...')
    print('reading data from', YIELDS_DIR)
    data = build()
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    out_path = DATA_DIR / 'yields.json'
    out_path.write_text(json.dumps(data, separators=(',', ':')))
    print(f'  wrote {out_path.relative_to(SITE_DIR)} ({out_path.stat().st_size/1024:.1f} KB)')
    print(f'  meta: {data["meta"]}')
    print('done.')


if __name__ == '__main__':
    main()
