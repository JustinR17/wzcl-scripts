from urllib.request import urlopen
import urllib.request
from datetime import datetime

# import ssl

# ssl._create_default_https_context = ssl._create_unverified_context

# mdl_url = "https://warlight-mtl.com/api/v1.0/games/?topk=10"
# print(urllib.request.urlopen(mdl_url).read())

d = datetime.now()
print(d.toordinal())
