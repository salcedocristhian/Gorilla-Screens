from playwright.sync_api import sync_playwright
from pathlib import Path
from bs4 import BeautifulSoup
base=Path('/mnt/data/gorilla_v16_field')
soup=BeautifulSoup((base/'index.html').read_text(),'html.parser')
for tag in soup.select('script,link[rel="stylesheet"],link[rel="manifest"]'):tag.decompose()
html=str(soup)
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-gpu'])
 iphone=browser.new_context(viewport={'width':390,'height':844},device_scale_factor=2,is_mobile=True,has_touch=True)
 page=iphone.new_page();errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content(html,wait_until='domcontentloaded')
 page.add_style_tag(path=str(base/'css/app.css'))
 for js in ['model','storage','scene3d','plan','field-plan','quote','editor','roof','manufacturers','app']:
  page.add_script_tag(path=str(base/f'js/{js}.js'))
 page.wait_for_timeout(1000)
 print('BODY',page.locator('body').inner_text()[:800], 'ERRORS',errors, 'HASH', page.evaluate('location.href'))
 assert page.get_by_text('Desde fotografías').count()>0, page.locator('body').inner_text()[:400]
 page.screenshot(path='/mnt/data/gorilla_v16_mobile_home.png',full_page=True)
 page.locator('[data-a="newphoto"]').click()
 page.wait_for_timeout(600)
 project1=page.evaluate('location.hash')
 assert project1.startswith('#/p/'),project1
 assert page.get_by_text('Proyecto sin modelo heredado').count()==1
 page.locator('a[href$="/fotos"]').first.click()
 page.wait_for_timeout(250)
 assert page.get_by_text('Captura la propiedad real').count() == 1
 page.screenshot(path='/mnt/data/gorilla_v16_mobile_fotos.png',full_page=True)
 page.locator('a[href$="/editor"]').first.click()
 page.wait_for_timeout(300)
 assert page.locator('#draftSvg').count()==1
 assert page.get_by_text('0 openings').count()>=1
 page.screenshot(path='/mnt/data/gorilla_v16_mobile_editor_empty.png',full_page=True)
 projectId=project1.split('/')[2]
 page.evaluate("id => location.hash='#/p/'+id+'/3d'",projectId)
 page.wait_for_timeout(300)
 assert page.get_by_text('Primero aprueba el dibujo del proyecto').count()==1
 page.evaluate("location.hash='#/'")
 page.wait_for_timeout(300)
 page.locator('[data-a="newphoto"]').click()
 page.wait_for_timeout(400)
 project2=page.evaluate('location.hash')
 assert project2!=project1
 page.evaluate("id=>location.hash='#/p/'+id+'/medidas'",project2.split('/')[2])
 page.wait_for_timeout(400)
 assert page.get_by_text('No hay geometría aprobada').count()==1
 page.screenshot(path='/mnt/data/gorilla_v16_mobile_medidas_blank.png',full_page=True)
 print('PASS browser routing, blank field project, photo navigation, 3D gated, project IDs isolated')
 print('errors:',errors)
 assert not errors,errors
 browser.close()
