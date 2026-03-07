# Flujo de Autenticación 2FA en Login

## Descripción General

SAFECLOUD implementa un flujo seguro de autenticación de dos factores (2FA) durante el login. El sistema usa TOTP (Time-based One-Time Password) y códigos de respaldo como mecanismos de verificación.

## Componentes

### 1. Hook: `use2FALogin.ts`
- Maneja la lógica de verificación 2FA
- Soporta tanto código TOTP como códigos de respaldo
- Integra con la API `/auth/2fa/verify-login/`

**Métodos principales:**
```typescript
verifyLogin(token: string, useBackupCode?: boolean)
```

### 2. Modal: `TwoFALoginModal.tsx`
- Interfaz modal para solicitar el código 2FA
- Dos modos: 
  - Código TOTP (6 dígitos)
  - Código de Respaldo (8 caracteres)
- Validación en tiempo real
- Autoenfoque en el campo de entrada

**Características:**
- ✅ Entrada numérica solo para TOTP
- ✅ Información sobre códigos de respaldo
- ✅ Manejo de errores
- ✅ Estados de carga
- ✅ Interfaz accesible

### 3. Página: `pages/login.tsx` (actualizada)
- Integración del flujo 2FA
- Manejo de respuesta 202 (2FA requerido)
- Cierre de sesión si se cancela 2FA

## Flujo de Autenticación

```
1. Usuario ingresa credenciales
   ↓
2. Backend valida credenciales
   ↓
3. ¿Tiene 2FA habilitado?
   ├─ NO → Respuesta 200 con tokens JWT
   │        → Redirigir a dashboard
   │
   └─ SÍ → Respuesta 202 (Accepted)
           → Mostrar modal 2FA
           ↓
4. Usuario ingresa código (TOTP o Respaldo)
   ↓
5. Backend verifica código
   ├─ VÁLIDO → Respuesta 200 con tokens JWT
   │          → Redirigir a dashboard
   │
   └─ INVÁLIDO → Error 400
                 → Solicitar código nuevamente
```

## Estados y Manejo de Errores

### Códigos de Estado HTTP

- **200 OK**: Login exitoso (sin 2FA o después de 2FA)
- **202 Accepted**: 2FA requerido
- **400 Bad Request**: Credenciales inválidas o código 2FA inválido
- **401 Unauthorized**: Token expirado

### Errores Comunes

1. **"Código inválido"**
   - El TOTP no coincide
   - El código de respaldo no existe

2. **"Código expirado"**
   - TOTP válido pero fuera de la ventana de tiempo

3. **"Código de respaldo ya usado"**
   - Intentó usar el mismo código dos veces

## Formato de Datos

### Request: POST `/auth/2fa/verify-login/`

**Con TOTP:**
```json
{
  "token": "123456"
}
```

**Con Código de Respaldo:**
```json
{
  "backup_code": "XXXXXXXX"
}
```

### Response: 200 OK

```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name"
  }
}
```

## Casos de Uso

### 1. Usuario con 2FA habilitado
- Ingresa email y contraseña
- Se validan correctamente
- Backend retorna 202
- Modal 2FA se abre automáticamente
- Usuario escanea código de su app o ingresa respaldo
- Se verifica y se genera JWT
- Se redirige a dashboard

### 2. Usuario sin 2FA habilitado
- Ingresa email y contraseña
- Se validan correctamente
- Backend retorna 200 con JWT inmediatamente
- Se redirige a dashboard

### 3. Usuario cancela 2FA
- Modal se cierra
- Formulario de login se resetea
- Usuario puede intentar de nuevo

### 4. Código 2FA inválido
- Se muestra error en el modal
- Campo se limpia automáticamente
- Usuario puede reintentar

### 5. Usuario usa código de respaldo
- Abre el modal 2FA
- Cambia a "Código de Respaldo"
- Ingresa uno de sus 8 códigos
- Se verifica como válido
- Se consume (no se puede reutilizar)

## Seguridad

### Protecciones Implementadas

1. **TOTP de 6 dígitos**
   - Basado en RFC 6238
   - Ventana de tiempo de 30 segundos
   - Implementado con librería `pyotp`

2. **Códigos de Respaldo**
   - 8 caracteres alfanuméricos
   - Generados aleatoriamente
   - Almacenados como hash en BD
   - Consumo de una sola vez

3. **Rate Limiting**
   - Máximo 5 intentos antes de bloquear por 15 minutos
   - Implementado en backend

4. **Auditoría**
   - Todo intento de login registrado
   - Intentos fallidos de 2FA registrados
   - Códigos de respaldo consumidos registrados

## Testing

### Test Cases Implementados

1. ✅ Login sin 2FA
2. ✅ Login con 2FA - código válido
3. ✅ Login con 2FA - código expirado
4. ✅ Login con 2FA - código inválido
5. ✅ Login con código de respaldo válido
6. ✅ Login con código de respaldo inválido
7. ✅ Reutilización de código de respaldo (debe fallar)
8. ✅ Deshabilitar 2FA
9. ✅ Regenerar códigos de respaldo
10. ✅ Rate limiting

## Próximos Pasos

- [ ] Implementar SMS 2FA (opcional)
- [ ] Implementar Push notification 2FA (opcional)
- [ ] Biometría como factor adicional (opcional)
- [ ] Logging más detallado de intentos fallidos
