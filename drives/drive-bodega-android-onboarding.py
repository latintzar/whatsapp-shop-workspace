#!/usr/bin/env python3
"""Compatibility entry for the native account onboarding proof.

The 0.4.x local-draft tester was replaced by authenticated onboarding in 0.5.0.
Its prior proof remains in Git at 57e9132645dabc1227ed0f1c90b3a3d1b57c3d58.
Run: ROCOTO_DIST=app/dist-android .venv/bin/python drives/drive-bodega-android-onboarding.py
"""

import runpy
from pathlib import Path

if __name__ == "__main__":
    runpy.run_path(str(Path(__file__).with_name("drive-bodega-native-account.py")), run_name="__main__")
