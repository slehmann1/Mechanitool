from django.db import models

# Create your models here.


class DistributionType(models.Model):
    # TODO: Limit name length
    name = models.CharField(max_length=30)

    def __str__(self) -> str:
        return self.name


class Stackup(models.Model):
    name = models.CharField(max_length=50)
    author = models.CharField(max_length=30)
    revision = models.CharField(max_length=10)
    description = models.CharField(max_length=200)

    def __str__(self) -> str:
        return f"{self.name} - {self.description} Author: {self.author} Rev: {self.revision}"

    def serialize(self):

        steps = {i: step.serialize() for i, step in enumerate(
            list(StackupStep.objects.filter(stackup=self)))}
        print(f"NAME: {self.name}")
        return {"name": self.name, "author": self.author, "revision": self.revision, "description": self.description, "steps": steps}


class StackupStep(models.Model):
    name = models.CharField(max_length=50, blank=True, null=True)
    nominal = models.FloatField()
    tolerance = models.FloatField(blank=True, null=True)
    std = models.FloatField(blank=True, null=True)
    lsl = models.FloatField(blank=True, null=True)
    usl = models.FloatField(blank=True, null=True)
    stackup = models.ForeignKey(Stackup, on_delete=models.CASCADE)
    distribution = models.ForeignKey(
        DistributionType, on_delete=models.CASCADE)

    def __str__(self) -> str:
        return f"{self.name} Distribution: {self.distribution} Nominal: {self.nominal} Tolerance: {self.tolerance} USL: {self.usl} LSL: {self.usl}"

    def serialize(self):
        return {
            "name": self.name,
            "nominal": self.nominal,
            "tolerance": self.tolerance,
            "std": self.std,
            "lsl": self.lsl,
            "usl": self.usl,
            "distribution": str(self.distribution)
        }
