import urllib.request
import urllib.error

url = "http://localhost:5172/api/permissions/modulos"

try:
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req) as response:
        print("Status:", response.status)
        print("Response length:", len(response.read().decode('utf-8')))
except urllib.error.HTTPError as e:
    print("HTTP Error:", e.code)
    print("Error Response:", e.read().decode('utf-8'))
except Exception as e:
    print("Error:", e)
