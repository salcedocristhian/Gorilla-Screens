from playwright.sync_api import sync_playwright
from pathlib import Path
from bs4 import BeautifulSoup
root=Path('/mnt/data/gorilla_v16_field');soup=BeautifulSoup((root/'index.html').read_text(),'html.parser')
for tag in soup.select('script,link[rel="stylesheet"],link[rel="manifest"]'):tag.decompose()
with sync_playwright() as w:
 b=w.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-gpu'])
 c=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,has_touch=True,is_mobile=True)
 page=c.new_page();errors=[];alerts=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('dialog',lambda d:(alerts.append((d.type,d.message)),d.accept()))
 page.set_content(str(soup));page.add_style_tag(path=str(root/'css/app.css'))
 for js in ['model','storage','scene3d','plan','field-plan','quote','editor','roof','manufacturers','app']:page.add_script_tag(path=str(root/f'js/{js}.js'))
 page.wait_for_timeout(180)
 page.locator('[data-a="newphoto"]').click();page.wait_for_timeout(150)
 pid=page.evaluate('location.hash.split("/")[2]');print('ID',pid)
 page.evaluate("id=>location.hash='#/p/'+id+'/fotos'",pid);page.wait_for_timeout(250)
 page.locator('input[data-cat="openings"]').set_input_files('/mnt/data/1000119919.jpg');page.wait_for_timeout(1100)
 print('photo saved?',page.locator('.ph img').count())
 assert page.locator('.ph img').count()==1
 page.locator('[data-trace]').first.click();page.wait_for_timeout(250)
 assert page.locator('#draftPhoto').count()==1
 assert page.locator('#draftPhoto').input_value()!=''
 page.locator('button[data-tool="rect"]').click();r=page.locator('#draftSvg').bounding_box();print('rect',r)
 x0,y0=r['x']+r['width']*.25,r['y']+r['height']*.24
 x1,y1=r['x']+r['width']*.53,r['y']+r['height']*.77
 page.mouse.move(x0,y0);page.mouse.down();page.mouse.move(x1,y1,steps=14);page.mouse.up();page.wait_for_timeout(400)
 print('opened',page.locator('[data-pick]').count(),page.locator('#draftDetail').inner_text()[:400]);assert page.locator('[data-pick]').count()==1
 page.locator('#dw').fill('4');page.locator('#dw').dispatch_event('change');page.wait_for_timeout(150)
 page.locator('#dh').fill('7');page.locator('#dh').dispatch_event('change');page.wait_for_timeout(150)
 page.locator('#dverified').check();page.wait_for_timeout(120)
 page.screenshot(path='/mnt/data/gorilla_v16_mobile_editor_verified.png',full_page=True)
 page.locator('#draftApprove').click();page.wait_for_timeout(500)
 obj=page.evaluate('id=>window.GSSStore.getProject(id)',pid)
 print('approved?',obj['approvedDrawing']['revision'] if obj['approvedDrawing'] else 'NO',obj['openings'],obj['designStatus'],'errors',errors,'dialogs',alerts)
 assert obj['approvedDrawing']['revision']==1
 assert obj['openings'][0]['w']==4
 assert obj['kind']=='field'
 assert obj['designStatus']=='approved'
 print('PASS photo saved, traced rectangular opening, field verification, approval, canonical project geometry')
 b.close()
