import asyncio
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_modulos():
    response = client.get("/permissions/modulos")
    print("Status Code:", response.status_code)
    if response.status_code != 200:
        print("Response:", response.text)

if __name__ == "__main__":
    test_modulos()
