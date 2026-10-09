"""Arma index.html del portal Ratio a partir de portal.html y de las obras de ORCID.
Uso:  python armar.py            (usa obras.json)
      python armar.py --orcid    (vuelve a descargar las obras desde la API pública de ORCID)"""
import html as _html
import json
import os
import re
import sys
import urllib.request

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(AQUI)
ORCID = '0000-0002-9067-3983'


def descargar():
    req = urllib.request.Request(f'https://pub.orcid.org/v3.0/{ORCID}/works', headers={'Accept': 'application/json'})
    d = json.load(urllib.request.urlopen(req, timeout=60))
    previas = {o['doi']: o for o in json.load(open(os.path.join(AQUI, 'obras.json'), encoding='utf-8'))}
    out = []
    for g in d['group']:
        s = g['work-summary'][0]
        doi = [e['external-id-value'].lower() for e in s['external-ids']['external-id'] if e['external-id-type'] == 'doi']
        o = {'titulo': s['title']['title']['value'], 'tipo': s['type'],
             'anio': (s.get('publication-date') or {}).get('year', {}).get('value') if s.get('publication-date') else None,
             'revista': (s.get('journal-title') or {}).get('value') if s.get('journal-title') else None,
             'doi': doi[0] if doi else None, 'autores': []}
        if o['doi'] in previas and previas[o['doi']].get('autores'):
            o['autores'] = previas[o['doi']]['autores']
            o['revista'] = o['revista'] or previas[o['doi']].get('revista')
        elif o['doi']:
            try:
                r = urllib.request.Request('https://doi.org/' + o['doi'], headers={'Accept': 'application/vnd.citationstyles.csl+json'})
                c = json.load(urllib.request.urlopen(r, timeout=60))
                o['autores'] = [(a.get('family', '') + ', ' + a.get('given', '')).strip(', ') for a in c.get('author', [])]
                rv = o['revista'] or c.get('container-title') or c.get('publisher')
                o['revista'] = rv[0] if isinstance(rv, list) and rv else rv
            except Exception as e:
                print('sin autores:', o['doi'], e)
        out.append(o)
    json.dump(out, open(os.path.join(AQUI, 'obras.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    return out


def limpiar(obras):
    for o in obras:
        t = re.sub(r'<[^>]+>', '', _html.unescape(_html.unescape(o['titulo'])))
        o['titulo'] = _html.escape(re.sub(r'\s+', ' ', t).strip(), quote=False)
        o['revista'] = _html.escape(o['revista'], quote=False) if o.get('revista') else None
        o['autores'] = [_html.escape(a, quote=False) for a in o.get('autores', [])]
        o['anio'] = int(o['anio']) if o.get('anio') else None
    return obras


if __name__ == '__main__':
    obras = descargar() if '--orcid' in sys.argv else json.load(open(os.path.join(AQUI, 'obras.json'), encoding='utf-8'))
    obras = limpiar(obras)
    pagina = open(os.path.join(AQUI, 'portal.html'), encoding='utf-8').read()
    assert '/*OBRAS*/[]' in pagina
    pagina = pagina.replace('/*OBRAS*/[]', json.dumps(obras, ensure_ascii=False, separators=(',', ':')))
    open(os.path.join(RAIZ, 'index.html'), 'w', encoding='utf-8', newline='\n').write(pagina)
    print('index.html', round(len(pagina.encode('utf-8')) / 1024), 'KB ·', len(obras), 'obras')
