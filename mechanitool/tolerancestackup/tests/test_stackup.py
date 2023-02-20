from django.test import TestCase
from tolerancestackup.stackup import Stackup
import numpy as np

class StackupStepTest(TestCase):
    def test_stackup_ft(self):
        stackup_dict = {
            0: {
                "name": "Step 1",
                "number": 1,
                "distribution": "Normal",
                "mean": 1,
                "std": 5,
                "lsl": "",
                "usl": "",
            },
            1: {
                "name": "Step 2",
                "number": 2,
                "distribution": "Normal",
                "mean": 1,
                "std": 5,
                "lsl": "",
                "usl": "",
            }
        }
        stackup_vals = Stackup(stackup_dict, num_samples=50000).calc_stack()

        self.assertAlmostEqual(np.mean(stackup_vals), 2, delta = 0.1)
        self.assertAlmostEqual(np.std(stackup_vals), 7.06, delta = 0.1)



