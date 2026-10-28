"""Bodega's fixed public routes to its existing connection provider's authorization probe."""
from __future__ import annotations

import os
import re
from urllib.parse import urlsplit

import httpx
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import Response

from .cedar_access import allowed_origin
from .cedar_whatsapp import PROVIDER_ORIGIN, UPSTREAM

router = APIRouter(prefix='/api/bodega/connection-test', tags=['bodega-connection-test'])
COOKIE = '__Host-bodega_connection_probe'
MAX_BYTES = 16 * 1024
RESULT_URL = os.environ.get('SHOP_PUBLIC_ORIGIN', 'https://shop.example.invalid').rstrip('/') + '/bodega-pay-later/?connection-test=direct&returned=1'


@router.get('/start')
async def start(request: Request) -> Response:
    return await _forward('start', request)


@router.post('/restart')
async def restart(request: Request) -> Response:
    return await _forward('restart', request)


@router.post('/complete')
async def complete(request: Request) -> Response:
    return await _forward('complete', request)


@router.get('/result')
async def result(request: Request) -> Response:
    return await _forward('result', request)


async def _forward(action: str, request: Request) -> Response:
    origin = request.headers.get('origin')
    if (request.method == 'POST' and not origin) or (origin and not allowed_origin(origin)):
        raise HTTPException(403, 'Open the connection test at its development address.')
    if os.environ.get('CEDAR_WHATSAPP_BRIDGE_ENABLED') != 'true':
        raise HTTPException(503, 'The connection test is awaiting its configured provider.')
    body = bytearray()
    async for chunk in request.stream():
        if len(body) + len(chunk) > MAX_BYTES:
            raise HTTPException(413, 'Send a shorter connection test response.')
        body.extend(chunk)
    headers = {'Origin': PROVIDER_ORIGIN, 'Content-Type': 'application/json', 'Accept': 'application/json'}
    cookie = request.cookies.get(COOKIE, '')
    if COOKIE in request.cookies:
        safe_cookie = cookie if re.fullmatch(r'[A-Za-z0-9_-]{43}', cookie) else 'invalid'
        headers['Cookie'] = f'{COOKIE}={safe_cookie}'
    try:
        async with httpx.AsyncClient(timeout=40, follow_redirects=False) as client, client.stream(
            request.method, f'{UPSTREAM}/api/proof/whatsapp/redirect/{action}',
            headers=headers, content=bytes(body),
        ) as upstream:
            output = bytearray()
            async for chunk in upstream.aiter_bytes():
                if len(output) + len(chunk) > MAX_BYTES:
                    raise HTTPException(502, 'The connection test needs a shorter provider response.')
                output.extend(chunk)
            response_headers = {
                'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer',
                'X-Content-Type-Options': 'nosniff',
            }
            if 300 <= upstream.status_code < 400:
                location = upstream.headers.get('location', '')
                target = urlsplit(location)
                meta = (target.scheme == 'https' and target.netloc == 'www.facebook.com'
                        and re.fullmatch(r'/v\d+\.\d+/dialog/oauth', target.path))
                if not (action in ('start', 'restart') and upstream.status_code == 303
                        and (meta or location == RESULT_URL)):
                    raise HTTPException(502, 'The connection test is awaiting its Meta destination.')
                response_headers['Location'] = location
            response = Response(bytes(output), status_code=upstream.status_code,
                                media_type='application/json', headers=response_headers)
            for value in upstream.headers.get_list('set-cookie'):
                if (value.startswith(COOKIE + '=') and 'domain=' not in value.lower()
                        and 'secure' in value.lower() and 'httponly' in value.lower()
                        and 'samesite=lax' in value.lower()):
                    response.headers.append('Set-Cookie', value)
            return response
    except httpx.HTTPError:
        raise HTTPException(503, 'The connection test is reconnecting. Open it again shortly.') from None
