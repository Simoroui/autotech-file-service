/**
 * Worker à attacher à la ZONE autotech-tunisia.com (pas au projet Pages).
 * - /pwa-icon.png et /logoicon.png : renvoie l’icône PWA (200) pour que Chrome propose l’installation.
 * - /reprogrammation/* : SPA fallback + correction canonique.
 *
 * Route Cloudflare : *autotech-tunisia.com/* (toutes les URLs pour que /pwa-icon.png soit géré).
 */

const PWA_ICON_B64 = "iVBORw0KGgoAAAANSUhEUgAAAKgAAACeCAMAAACRtrE2AAABqlBMVEUAAAAAAAAAAAD////QNC/8/PwKCgqanJ4GBgYCAgKwsLAODQ07OzzVKyUFBAQTExMsLCz5+fnu7+/+/v7QNTDg4eEkIyMfHx/T1NX09PSbnqDLzM3XNC/TLigoJycaGhrj5OSrra5DQ0RTVFTSMSujp6mjo6SOj5AzNDT29/fX19jFxsedoaNAQEDx8vJcXV5LS0wREBHP0NC3uLqEhYZ/gYJHR0jCw8Q4ODjQMy0YFxfr7Oy6u72QkpRiYmLo6Om+v8CnqKllZmjUMy6ztLWUlpdWWVrSNC8iCgmwsrSdn6BvcXJsbW5oamvUNTAxLzDXKSMNBAPd3d58fX50dXaXmJl4eXpQUFDaNC8tDQzZ2tuXmpyuiIlaVlcZBwaera+Hi4yLiYnOOjWaJyRmHBrAXFrEUU7KQj6/MCudnJy0KyemmZrPMy6LJCBzIB1LFxWokpOxgIC1dXSWp6qEkpS4bGvWMSxZGBaRoKLJSEXFMCt9IB4/EhGgs7adsrSqKyc3Dg16hIZtd3kxKSmftbiSaWlvZme2YWCLNjMtGhqUVlSzTktvRUSsOziPbpb2AAAAAnRSTlPy5YB5WPAAAA3PSURBVHja7Z1nVxpZGMezd6QMHZEiIAhIERAERBFBBRS7GLuxd2NMzyabnk22l++8cwFnhoWZuXOdnJOc4/9dxPKb+/Tnornzw53vQj/cAd+J7nwnpHduQW9Bv3Hdgt6Cfuu6Bb0F/db1NUCVCWvGOzg6up5Op+dH495BQ1ZPgptIclC11RA/vO9ImjsJlmQj4XAuuD5owMGVHlTt2j2MdBN8shUGBt1KgC7pQbO+Q4eRQJCsPbeQUQMUSQ/q3giYZSyY3s6R7uWwYyhpov4Ri9jCy+2dvSbmdaPtcDAB+CU9qHpwtptBiJltQynFweqoz6upGCLUh5aDmkqmr7xwUBg3x5iDTa66eBxWelDLioMVMkOqtdWNjCErBzWtUR92pOtOKde7NMVgpJ3+/EI/x7FKD1oZGLk+ym7HzOR8f0WvAyytUK+kFgBLZCIUD9rqfmJK7upBk6QHDc321s+me2gmOBpqTj6rJsLo6Qf/E6nvO0wSNYXnEVHxQTP36+fS7lDli5WWVtwgiJFoBbSQXnNorqOOsnKA9KDW9Xoy6h73r/e7QWtpkrKwnevI3OXxWiaIxOteLD2ofGGshmlO2ecr3D+GVM8H57hflns9Nat4Ml8HVDNRx5yYLLoAr3RqJe/LodkqasyrlB40sSKrhuxYKlq0gBtLo5IRsgk/l/fggxpy9ePcXjfwndXdvenpra2t6em9PR3Je6obDoddAyQG1cWv+6L2YOt0Te5tvXv19vjj5cXVVdvU1NXVxcXH44cnj7emdZy+ujEKJAbNzhK0ZvTNj7H37tHxRZvTOeVcnGqjteicWtwsXX18+2r6LuCQtKChWr10RKq294IG3f10cnzlLJUgYStNTZWcpctH75BZ8UH7qkmpM2cvF2GPlCZZBp8++bgIj1FAi87SxdtPSKz4oAvV/DzmyWsAyMNEbaEP8/Hx1eZiG6KczsuTaUBLalByoFbxZtNW6P8pqijtgqr2Xl0uQkp0TTnfPNwC4KuA6qqcsoi9XprdNrPqQA4xH11Ai4uVswRRpQclg5DTmFP46IbZO++mjH5y4YSY4tWx9NqrlBxUV+XsnMl7G/EfXzrbMNXV9uAnyRtn3WGV0xNsrEXTx85FXM6erp3nFilNz9g95gm6GuhfXUFMPA1rn33ISO6jK6baeVoajvPhJi4ldNDfP8SB1KAbNc7JBs53b5w34NSe7c+RUoNmOmEZUjX4J3kCMbE5u44CB2ogMai1G+bPlCLELusPb8TZ0/PkuRVIDCrPVcea7UHAaO+4hI8JA+nphy9AatAVyGnbLrPD6KLEydDTda2enmGOT1r68b0XSA3aDznNs2zP37pwtjAnlRi1Wu3w0fnrs9PT07Oz1+dHJeojPcMdHW2NogKpSEoN6u6GAe8fULM435SaKIcppLbXp892nhyuzBXj5XLZ54v/9uuvv5+dd1Rh2QF/7v9ZCSQG1angFJdas7Ds/maqqchoteenTx/kV8sha4LFoFTrXYO7f/191KUdZgK+48ELPZAaNE5QSkb72JyL/6/Z2qPTncCLskvN8bDZyj9/dyx1wWOFD7WzbwVSg2bHCLiTWdUx8X7pbLQ5dZjPAi/iBn5jqr/88+9LChVWzvd9QHLQSZhBZ1jT5t3jxYYA0mrPnu7/rJEDYakf/1HSDi+dvqf7ROlAK1XDK1i9w1tno9Ff7+x/dukAmsg//+h5TVVOUskpHRaocghO79F5QOvxJru8LJ0/3Z9zATH6c/RAqS6oOOXR44DuEpRyrGXcFjuDa3t+9L+oAJEi1boAwaM1g3jQxHI11fuYE74ssY7z7MFPG3IgXqsEn+7tigedhz1TIc2E86NNxjt7nu1/dgMMeWW8oGPrOrGgeliTjENMJH0qMWY/f7LfT+JwumIErzrX9GJBF4iq8u7rzHS5SJv91D+At2+UO4Suy2YsIkHV5muvqR/dyeY1JzXtLMixOHX3CSFFQiJBBwla9xOwJL28ds/hnQ/9AE9zhKCSZXGgynGYQ8dM1a3DgRWAh87rIeLJ8wwmZ59RGLR7nhQFmoFd00Q6Di/abFEL2Nqs92hHD35yYXJaugUxYTSpRYFOwoeLagBIGOIDqyQ4XqQ5cdf28giBIKPHKgZUDy8sx/OJWgjIwafNut3xOcEhgaTxkBhQX7Wvp6sEeeysxvvwk+fYnKMEmpL9IkBJDxzo7DTUdKk+PP4SwuXU9CKCLs+T6KDWdjiApHXs7g4Oj7+IHx6Z5QCi2vNqdFAf/AK/hm6XL6Zqw+MoLqd8iECV0aNHB1VBy09mG9rQrqPZAzUu6DqBLFMqgwLK9COpeZIOpVLVQfet+IEkQg4vMmifjCBihUE6lK5gBj19j1s44ZZNhJYXkEFXYC9ip8/vFWX5no4HcGuApYSZEKORAaUwKFPnhwbkLMt3UBGPm0GVBUKUemeziKDZGOwLd2nLw7XBkb8IMJUmxMmUciGCauD5+zPsmNc++ymLydlPiFXEiwj6W9VF3fSo5OzoOfeXMTlDI6JB7xURQQPVd1XJr7P9xymqJj3XY2b6JCFaYytooHIqlkw5+qm2YMgHigB39hCvzkk9EqjbDOsY7SfvNmEOxQz5VQJDMpUFCdQK774CdKE/cQ5rd16QWJxeE18asnG9GtEggfbB5n6bTvcPnT3nBQ0Wp2uM4NGQh+sVWxkJFI6K4aCeHuentL8/x8pNat4h3rydXuYa8NZ1KKADMOhXrsvY3sVU187PWIE0yccZ86cTKq7X8moU0DVolgU66Es9R4F+yYd42UTUBfJcL3osKKABOGHF6Y3my64zrP5uUMbbyyk2AChyFdEhDQqog3qkXJkuoE7tjy8wGma3mddBZ9dJAHyc0bSLAhqm0uhEH9PjaXc+Sz179PqrOd0l43qOORIBNAnXokwafdn2YEM86AF/fxQ1AEqWEa4B70COAGqjilghRLckL8/94mfkXYJPNnvNsxI2zgHPjQYa8xtoUO2ZX3Qs9fXyNh3RlXqenCA4lAshgJohqIUe6ZdORXdO+jD/PLxmFdryJH0IoPcaQB9SQa8UmelV/MulaEgw1ZrnEU1foEEfLT37LLIjyfNyhu2jwq7cPiBHC6YAC/TpgpSzx0iUxWDgGfCQ0pPMRr/7/2RpJy7hvYfMo2CFpptz4E8ZUBI+VMw2XvDBhL+04xMVSDaCT0P2PvYnO7jXJcKgE4xLb6ipGfSJRswQzx9I9+wNfkSqOD9xFKl7qquTyqDvXj4ZlGwb1h4YaGwb7nMPeDpB0GDVlzpHlh2paBZsQVCJWibZTNTSdOvWWp12vSDoKswhhcn0Qn8lS4LpNzvooBb+IT5i70cttbIJgyCoD1aGol53PYrseJEDKcm/prM3bb1D3A+lEQStVPssQJemp6igZIB/XPfnm8yZ5cxP4bLwXB+j0nKQdvqTX8tSrGthb+dqbls5k1n3KikEqndAX6Yrw6e/4oiBJLBItrdoa3UFzvNXqIVASRWMzwqoa+8PtHWO1cx/xxldV6L3BZDAygPKLDSZ8eruyYYSZfYY59/OFibpXhglP0ECQVAf9GUf83sqegRQ8j6/g+bsldb+YuIcAzYEQS2NvnxXLRcGjRMCw4dP7IVe9xwpBApDsZfxZVIpPC1nBN7SEk1zWMU9xnODJwQK7kNbuVh2vWEgGT0KN9d+KswdTVlB0F1oLBEVXjchcLNt7+P0bRX3V7kEQV29lLXo2nTTQCLCilGcW3zHoCCoEm51oglUUB8h3Ntxap577VPkA2UyacSFyFkxCryTSWHhWwFwP+CBMKjGRKUHxBJvDRO8Gprl9XaXjDME/cKgcNdizCuRZg+BQFq2L5B47zjo5Adlrm0jFgnuPcYUK3L+B+Vc+yXXEEANJupn+G4eSMS9yGFGU1cm1FeXV2M1XCvHeYmzigCqhJdis8Kl0xAjsGSKtdc1YuR6xKiBH5Sp3baQ4FrZQXwtmWbSShRQ/RhV71eFMn2B+Goy2wXbPOYSJ+LmBy1KQdRt5DpQNFADNXbFRlG3YfgK+2UtPVSRAYKgzBJjRs2Xqrsl4GyPHiy37LdWdKigBhn1bfoR7j3wBYGC+nyrHGoPAVRQAH+TfoLzSEkPIYFyswbwW6s+BmXjzD7SWD/CEI8vx7YPgLipKdenJt1ooMxaL8VxpCGZBJzL9iLsgGRNAQb7GBGgll7KieJC2zB8jdQaVZexyfBc1+B8y857VqGWCT+QJrOt3mgmm4CGFwWqtlGZN03C0PFNsn0gKEWNzG3Xirnuf+kjougD6KBMSm+vAOAKyIiIAWWIR5dD4aOXgM2Oiw7KFPNcJm+ElopapQwks4JuqOcaHfdALh4UZOnq06ua/FLvyZclCaS0ulVP21kY0APxoMw3MU7k66aXSxJIKlbAeI3Mx2cULiAelLkjkeXomjYgSUVSfGFVlnYm0ys0ABNUfQ8+aEpBlyiN+eacye2N5nd1QM5tL8AFhfu2xr8rZgjfvCLNsTO6bpzFiQXKJKP2EPsEcPsmZnXSGNiBmn/mICceKJPek1m2OwRMMnz1qvLuFtd9vROQ80agchXcranZJdS7rcCVfS2oaVVXPGsagA/K/ILPWDAB2KjyGwg0v1fZDH+L78agwOoZjw5YwdeSwZiMrugBr1D/8kufRge+mvSu+LzQousb+Ru5CcFj+EZAAbgFFdQt6DevW9Bb0G9d3wsnAN/Nf9LzHwbYuJ7qoHxwAAAAAElFTkSuQmCC";

function pwaIconResponse() {
  const bin = atob(PWA_ICON_B64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Response(bytes, {
    status: 200,
    headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=86400" },
  });
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === "/pwa-icon.png" || path === "/logoicon.png") {
      return pwaIconResponse();
    }

    if (!path.startsWith("/reprogrammation/")) {
      return fetch(request);
    }

    const indexUrl = url.origin + '/';
    const res = await fetch(new Request(indexUrl, { method: request.method, headers: request.headers }));

    if (!res.ok || !res.headers.get('Content-Type')?.includes('text/html')) {
      return new Response(res.body, { status: res.status, statusText: res.statusText, headers: res.headers });
    }

    let html = await res.text();
    const canonical = url.origin + url.pathname + (url.search || '');
    html = html.replace(
      /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i,
      '<link rel="canonical" href="' + canonical.replace(/"/g, '&quot;') + '">'
    );

    const headers = new Headers(res.headers);
    headers.set('Content-Type', 'text/html; charset=utf-8');

    return new Response(html, { status: 200, statusText: 'OK', headers });
  },
};
