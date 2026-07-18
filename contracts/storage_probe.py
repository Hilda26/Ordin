# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

# Minimal storage probe for StudioNet.
# Exercises every storage primitive Ordin relies on before the full contract
# is trusted: scalar counters, str/u64/u256/bool TreeMaps, .get defaults,
# JSON-string round-trips, and repeated writes to the same key.

from genlayer import *

import json


class StorageProbe(gl.Contract):
    seq: u64
    m_str: TreeMap[str, str]
    m_u64: TreeMap[str, u64]
    m_u256: TreeMap[str, u256]
    m_bool: TreeMap[str, bool]

    def __init__(self):
        self.seq = u64(0)

    @gl.public.write
    def probe_all(self, key: str, text: str, small: u64, big: u256, flag: bool) -> str:
        self.seq = u64(int(self.seq) + 1)
        self.m_str[key] = text
        self.m_u64[key] = small
        self.m_u256[key] = big
        self.m_bool[key] = flag
        # JSON round-trip in storage
        rec = {"key": key, "n": int(small), "big": str(int(big)), "flag": flag}
        self.m_str[key + ":json"] = json.dumps(rec)
        return "ok:" + str(int(self.seq))

    @gl.public.write
    def probe_append(self, key: str, value: str) -> str:
        cur = self.m_str.get(key, "")
        arr = json.loads(cur) if cur else []
        arr.append(value)
        self.m_str[key] = json.dumps(arr)
        return str(len(arr))

    @gl.public.view
    def read_all(self, key: str) -> str:
        return json.dumps(
            {
                "seq": int(self.seq),
                "s": self.m_str.get(key, ""),
                "n": int(self.m_u64.get(key, u64(0))),
                "big": str(int(self.m_u256.get(key, u256(0)))),
                "flag": self.m_bool.get(key, False),
                "json": self.m_str.get(key + ":json", ""),
            }
        )
