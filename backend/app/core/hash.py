import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../")))

from app.core.security import hash_passwod

print(hash_passwod("Admin_Icvc123"))
print(hash_passwod("yeferson123"))