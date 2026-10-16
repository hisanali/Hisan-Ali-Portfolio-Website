"""Offline acquisition of the Adobe Mixamo assets credited in ASSET-CREDITS.md."""
import urllib.request,urllib.parse,concurrent.futures,pathlib,sys
root=pathlib.Path(sys.argv[1] if len(sys.argv)>1 else '/tmp/football-source');root.mkdir(exist_ok=True)
names={'jog':'jog forward','backpedal':'jog backward','strafe-left':'jog strafe left','strafe-right':'jog strafe right','pass-short':'kick soccerball','pass-long':'kick soccerball (2)','strike':'strike foward jog','trap':'receive soccerball','slide':'soccer tackle','tackle':'soccer tackle (2)','header':'header soccerball','throw-in':'throw in','catch':'goalkeeper catch (2)','punch':'goalkeeper body block','keeper-throw':'goalkeeper overhand throw','goal-kick':'goalkeeper drop kick','idle':'offensive idle','ready':'goalkeeper idle','dive':'goalkeeper diving save','dive2':'goalkeeper diving save (2)'}
def get(item):
 n,s=item;url='https://raw.githubusercontent.com/kuiralabs/midnight-kicks/e81a88ca03c8f78517dc6b0785c50a2a27c987b7/unity/Assets/Animations/Mixamo/Soccer%20Game%20Pack/'+urllib.parse.quote(s+'.fbx');urllib.request.urlretrieve(url,root/(n+'.fbx'));return n
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:print(list(pool.map(get,names.items())))

base='https://huggingface.co/datasets/Linzhan/Mixamo-Animations-Characters/resolve/7f134bc734557b1d9516cb476d25ea1f577e45c1/animation/'
clips={'turn90':'Running_Right_Turn','turn180':'Running_Turn_180','dribble-jog':'Dribble','pass-ground':'Soccer_Pass','celebrate2':'Victory_2','celebrate3':'Victory','sprint':'Sprint'}
def get(item):
 name,filename=item;urllib.request.urlretrieve(base+filename+'.fbx',str(root/(name+'.fbx')));return name
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as p:print(list(p.map(get,clips.items())))

urllib.request.urlretrieve('https://raw.githubusercontent.com/kuiralabs/midnight-kicks/e81a88ca03c8f78517dc6b0785c50a2a27c987b7/unity/Assets/Models/soccer_character.fbx',str(root/'character.fbx'))
urllib.request.urlretrieve('https://raw.githubusercontent.com/tairqaldy/three.js-3d-portfolio-website/635d20527fb68d5ca4f7e325e64a59529060ff50/public/models/animations/victory.fbx',str(root/'celebrate.fbx'))
