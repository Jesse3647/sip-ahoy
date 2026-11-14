"""Refresh factual drink names, menu groupings and prices from community menus.
No recipes, descriptions, reviews, photographs or page prose are republished.
Run manually; the application never makes network requests to these sites.
"""
from pathlib import Path
from html.parser import HTMLParser
from decimal import Decimal
import json, re, hashlib, urllib.request, concurrent.futures, argparse
from datetime import date
ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / 'work' / 'catalog'
CACHE.mkdir(parents=True, exist_ok=True)
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--cached',action='store_true',help='Rebuild from already downloaded pages without marking them newly checked')
args=parser.parse_args()
cache_files=list(CACHE.glob('*.html'))
AS_OF = date.fromtimestamp(min(p.stat().st_mtime for p in cache_files)).isoformat() if args.cached and cache_files else date.today().isoformat()
ships = re.findall(r'"([^"]+ of the Seas)"', (ROOT / 'src/ships.ts').read_text())
class Node:
 def __init__(self, tag='', attrs=(), parent=None): self.tag,self.attrs,self.parent,self.children=tag,dict(attrs),parent,[]
 def text(self): return ''.join(c if isinstance(c,str) else c.text() for c in self.children)
 def nodes(self):
  yield self
  for child in self.children:
   if isinstance(child,Node):yield from child.nodes()
class Tree(HTMLParser):
 def __init__(self): super().__init__();self.root=Node();self.current=self.root
 def handle_starttag(self, tag, attrs):
  node=Node(tag,attrs,self.current);self.current.children.append(node)
  if tag not in ('area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'): self.current=node
 def handle_startendtag(self, tag, attrs): self.handle_starttag(tag,attrs);self.handle_endtag(tag)
 def handle_endtag(self, tag):
  node=self.current
  while node.parent:
   if node.tag==tag:self.current=node.parent;return
   node=node.parent
 def handle_data(self, data):self.current.children.append(data)
def key(s):return hashlib.sha256(s.encode()).hexdigest()[:16]
def category(section, name, description):
 s=section.casefold();n=name.casefold()
 if any(x in s for x in ['zero','spirit-free','non-alcohol','mocktail']):return 'Mocktail'
 if any(x in s for x in ['coffee','espresso','cappuccino','latte']):return 'Cocktail' if any(x in s for x in ['cocktail','spiked']) else 'Coffee'
 if any(x in n for x in ['cabernet sauvignon','pinot grigio','pinot noir','chardonnay','sauvignon blanc','merlot','riesling','malbec','barolo','brunello','red blend','white blend','chenin blanc','zinfandel','albariño','vermentino','moscato']) and not any(x in n for x in ['martini','sangria','margarita','spritz','sour']):return 'Wine'
 if any(x in s for x in ['wine','sparkling','rosé','white','red','champagne','sake']):
  if 'cocktail' not in s:return 'Wine'
 if any(x in s for x in ['beer','lager','pilsner','wheat','ale','beyond beer','cider','stout','second cousins','belgian','brawny','crisp, clean']):return 'Beer'
 if any(x in s for x in ['vodka','rum','gin','tequila','mezcal','whisk','bourbon','scotch','cognac','liqueur','apéritif','aperitif','spirits']) and 'cocktail' not in s and 'trip' not in s:return 'Spirit'
 if 'soda /' in s or s in ['soda','water','juice','energy']:
  if 'water' in n:return 'Water'
  if 'juice' in n:return 'Juice'
  return 'Soft drink'
 if 'tea' in s:return 'Cocktail' if 'cocktail' in s else 'Tea'
 if any(x in s for x in ['smoothie','shake']):return 'Smoothie'
 # Mixed restaurant sections are classified by their factual serving names.
 if any(x in n for x in ['sapporo','asahi','kirin','ichiban']):return 'Beer'
 if any(x in n for x in ['junmai','nigori','sake','daiginjo']):return 'Wine'
 return 'Cocktail'
def get_ship(ship):
 slug=ship.lower().replace(' ','-');url=f'https://cruiserhacks.com/ships/royal-caribbean/{slug}/bar-menus-prices/'
 path=CACHE / f'{slug}.html'
 if args.cached and path.exists():html=path.read_text()
 else:
  req=urllib.request.Request(url,headers={'User-Agent':'SipAhoy catalog research/0.1'})
  with urllib.request.urlopen(req,timeout=35) as r:html=r.read().decode('utf-8')
  path.write_text(html)
 match=re.search(r'<script[^>]+id="bar-ld"[^>]*>(.*?)</script>',html,re.S)
 if not match:raise ValueError(f'No structured menus for {ship}')
 menus=[m for m in json.loads(match.group(1))['@graph'] if m.get('@type')=='BarOrPub']
 if any(not m['name'].endswith(' on '+ship) for m in menus):raise ValueError(f'Unexpected ship data for {ship}')
 tree=Tree();tree.feed(html)
 cards={}
 for node in tree.root.nodes():
  if node.attrs.get('id','').startswith('bar-') and node.tag=='div':
   track=next((x.attrs['data-track'] for x in node.nodes() if x.attrs.get('data-track','').startswith('bar menu: ')),None)
   if track:
    links=[x for x in node.nodes() if x.tag=='a' and 'source' in x.text().lower() and x.attrs.get('href','').startswith('https://')]
    cards[track.removeprefix('bar menu: ')]=links[0].attrs['href'] if links else None
 sources={};rows=[]
 for menu in menus:
  venue=menu['name'].removesuffix(' on '+ship)
  # Source links remain linked; the aggregation is not treated as a verified onboard observation.
  src={'url':url,'publisher':'CruiserHacks community menu compilation','retrievedAt':AS_OF}
  if cards.get(venue):src['menuSourceUrl']=cards[venue]
  sourceId=key(json.dumps(src,sort_keys=True));sources[sourceId]=src
  for sec in menu['hasMenu']['hasMenuSection']:
   for item in sec['hasMenuItem']:
    offer=item.get('offers',{});amount=offer.get('price');currency=offer.get('priceCurrency')
    if currency not in (None,'USD'):continue
    price=int(Decimal(amount)*100) if amount and re.fullmatch(r'\d+(\.\d{1,2})?',str(amount)) else None
    name=item['name'].strip()
    if len(name)>100 or not name:continue
    names=[name]
    if name=='Coca-Cola, Diet Coke, Coca-Cola Zero, Sprite, Fanta Orange, Ginger Ale, Tonic':names=['Coca-Cola','Diet Coke','Coca-Cola Zero','Sprite','Fanta Orange','Ginger Ale','Tonic']
    if name=='Cranberry, Grapefruit, Orange or Pineapple Juice':names=['Cranberry Juice','Grapefruit Juice','Orange Juice','Pineapple Juice']
    if name=='Truly Hard Seltzer (Wild Berry, Pineapple or Strawberry Lemonade)':names=['Truly Wild Berry','Truly Pineapple','Truly Strawberry Lemonade']
    for drink_name in names:rows.append({'name':drink_name,'category':category(sec['name'],drink_name,item.get('description','')),'priceCents':price,'venue':venue,'section':sec['name'],'sourceId':sourceId})
 return ship,rows,sources
sources={};ships_data={};errors=[]
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
 futures={pool.submit(get_ship,s):s for s in ships}
 for future in concurrent.futures.as_completed(futures):
  ship=futures[future]
  try:
   ship,rows,src=future.result();ships_data[ship]=rows;sources.update(src);print(ship,len(rows),flush=True)
  except Exception as e:
   if ship == 'Hero of the Seas': print('No verified ship-specific menu:',ship,flush=True)
   else: errors.append((ship,str(e)));print('ERROR',ship,str(e),flush=True)
if errors:raise SystemExit('No catalog written. Fix the missing sources: '+str(errors))
# Supplemental factual cafe menus are maintained separately with their own sources.
supplemental=json.loads((ROOT/'src/data/supplemental-menus.json').read_text())
for menu in supplemental['menus']:
 source_id=key(menu['sourceUrl']);sources[source_id]={'url':menu['sourceUrl']}
 for ship in menu['ships']:
  if ship not in ships_data:continue
  for item in menu['items']:ships_data[ship].append({**item,'venue':menu['venue'],'section':item['category'],'sourceId':source_id,'sourceUrl':menu['sourceUrl'],'retrievedAt':supplemental['retrievedAt']})
# Normalize factual observations across ships; no authored descriptions are stored.
source_records={};observations={};ship_profiles={}
for ship in ships:
 if ship not in ships_data:continue
 item_ids=[];venue_sources={}
 for raw in ships_data[ship]:
  original=sources[raw['sourceId']]
  url=original.get('menuSourceUrl',original['url']);source_id=key(url)
  source_records[source_id]={'url':url}
  venue_sources[raw['venue']]=source_id
  row={k:v for k,v in raw.items() if k!='sourceId'};row_id=key(json.dumps(row,sort_keys=True))
  observations[row_id]=row;item_ids.append(row_id)
 slug=ship.lower().replace(' ','-')
 ship_profiles[ship]={'sourceUrl':f'https://cruiserhacks.com/ships/royal-caribbean/{slug}/bar-menus-prices/','itemIds':sorted(set(item_ids)),'venueSources':venue_sources}
result={'version':1,'retrievedAt':AS_OF,'sources':source_records,'shipProfiles':ship_profiles,'observations':observations}
(ROOT/'src/data/community-catalog.json').write_text(json.dumps(result,ensure_ascii=False,separators=(',',':'))+'\n')
print('Written',len(observations),'unique venue observations across',len(ship_profiles),'ships')
