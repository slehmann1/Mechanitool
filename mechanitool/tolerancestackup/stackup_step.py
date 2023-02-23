import numpy as np
from tolerancestackup.distributions import Normal, Uniform


class StackupStep:

    def __init__(self, stackup_dict: dict):
        self.name = stackup_dict["name"]
        self.number = stackup_dict["number"]

        if stackup_dict["distribution"] == "Normal":
            lsl = usl = None
            if stackup_dict["lsl"]:
                lsl = float(stackup_dict["lsl"])
            if stackup_dict["usl"]:
                usl = float(stackup_dict["usl"])

            self.distribution = Normal(
                float(stackup_dict["nominal"]), float(stackup_dict["std"]), lower_lim=lsl, upper_lim=usl)

        elif stackup_dict["distribution"] == "Uniform":
            # TODO: ADD
            raise NotImplementedError("Don't yet support uniform")
        else:
            raise ValueError(
                "Distribution in stackup dictionary is not recognized")

    def set_num_samples(self, num_samples):
        self.distribution.num_samples = num_samples

    def to_dict(self):
        return {
            'name': self.step_name,
            'distribution': self.distribution
        }

    def calculate(self, num_samples: int = None):
        """
        Calculates the distribution.
        :param num_samples: The number of samples, optional
        :return: None
        """
        if num_samples is not None:
            self.distribution.num_samples = num_samples

        return self.distribution.calculate()
