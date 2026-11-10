"""Restablece la cuenta por defecto (usuario y contraseña de D-04) sin tocar datos académicos."""
from sema.db import open_db, transaction
from sema.auth import INITIAL_PASSWORD, INITIAL_USER
import bcrypt

def reset(db):
    hashed = bcrypt.hashpw(INITIAL_PASSWORD.encode(), bcrypt.gensalt(rounds=10)).decode()
    with transaction(db):
        db.execute('UPDATE usuarios SET usuario=?,password_hash=?,password_por_defecto=1,actualizado_en=datetime(\'now\',\'localtime\') WHERE id=(SELECT id FROM usuarios ORDER BY id LIMIT 1)',(INITIAL_USER,hashed))

if __name__ == '__main__':
    db = open_db()
    reset(db)
    db.close()
    print(f'Cuenta restablecida: usuario {INITIAL_USER} con la contraseña por defecto.')
