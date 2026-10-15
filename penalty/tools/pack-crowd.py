"""Pack generated 8x4 portraits into padded, isolated texture cells."""
from PIL import Image
import numpy as np
from scipy.ndimage import label
from pathlib import Path
import sys
im=Image.open(sys.argv[1]).convert('RGBA');w,h=im.size
rows=[0,298,563,812,h];out=Image.new('RGBA',(2048,1536))
for row in range(4):
 for col in range(8):
  crop=im.crop((round(col*w/8),rows[row],round((col+1)*w/8),rows[row+1]));arr=np.array(crop);labels,count=label(arr[:,:,3]>100);counts=np.bincount(labels.ravel());counts[0]=0;component=np.argmax(counts)
  # Keep the principal silhouette, removing fringe pieces of adjacent fans.
  arr[:,:,3]=np.where(labels==component,arr[:,:,3],0);portrait=Image.fromarray(arr);box=portrait.getbbox()
  if box:portrait=portrait.crop(box)
  portrait.thumbnail((238,342),Image.Resampling.LANCZOS)
  out.alpha_composite(portrait,(col*256+(256-portrait.width)//2,row*384+376-portrait.height))
out.save(sys.argv[2],quality=90)
