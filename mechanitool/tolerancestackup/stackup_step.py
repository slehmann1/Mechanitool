import numpy as np
from tolerancestackup.distributions import Normal, Uniform
import tolerancestackup.models as md


class StackupStep:

    def __init__(self, stackup_dict: dict):
        self.name = stackup_dict["name"]
        self.number = stackup_dict["number"]
        self.nominal = float(stackup_dict["nominal"])

        self.tolerance = float(stackup_dict["tolerance"])
        self.distribution_name = stackup_dict["distribution"]
        self.lsl = self.usl = self.std = None

        if self.distribution_name == "Normal":
            self.std = float(stackup_dict["std"])
            if stackup_dict["lsl"]:
                self.lsl = float(stackup_dict["lsl"])
            if stackup_dict["usl"]:
                self.usl = float(stackup_dict["usl"])

            self.distribution = Normal(
                self.nominal, self.std, lower_lim=self.lsl, upper_lim=self.usl)

        elif self.distribution_name == "Uniform":
            self.distribution = Uniform(
                self.nominal, self.tolerance)
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

    def to_model(self, stackup):
        """Creates a models.StackupStep representation of the stackupstep. Does not commit to the database

        Returns:
            models.StackupStep: Model representation of the stackup step
        """
        stack_mod = md.StackupStep(nominal=self.nominal,
                                   tolerance=self.tolerance, std=self.std, distribution=md.DistributionType.objects.get(name=self.distribution_name), stackup=stackup)
        if self.lsl:
            stack_mod.lsl = self.lsl
        if self.usl:
            stack_mod.usl = self.usl
        if self.name:
            stack_mod.name = self.name[: 49]
        if self.std:
            stack_mod.std = self.std

        return stack_mod

    def calculate(self, num_samples: int = None):
        """
        Calculates the distribution.
        :param num_samples: The number of samples, optional
        :return: None
        """
        if num_samples is not None:
            self.distribution.num_samples = num_samples

        return self.distribution.calculate()
